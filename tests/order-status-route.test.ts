import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findFirst: vi.fn(),
  findServiceOrder: vi.fn(),
  syncPayosOrderStatus: vi.fn(),
  syncPayosServiceOrderStatus: vi.fn(),
  reclaimPaidPayosOrder: vi.fn(),
  reclaimPaidPayosServiceOrder: vi.fn(),
  runOrderFulfillment: vi.fn(),
  notifyPaymentReview: vi.fn(),
  allowUserAction: vi.fn(),
  clearCheckoutHandoff: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/prisma", () => ({
  prisma: { order: { findFirst: mocks.findFirst } },
}));
vi.mock("@/lib/service-orders", async () => {
  // serviceOrderView là hàm thuần, giữ bản thật để test bám vào luật thật.
  const actual = await vi.importActual<typeof import("@/lib/service-orders")>(
    "@/lib/service-orders",
  );
  return {
    ...actual,
    findServiceOrder: mocks.findServiceOrder,
    syncPayosServiceOrderStatus: mocks.syncPayosServiceOrderStatus,
    reclaimPaidPayosServiceOrder: mocks.reclaimPaidPayosServiceOrder,
  };
});
vi.mock("@/lib/orders", () => ({
  syncPayosOrderStatus: mocks.syncPayosOrderStatus,
  reclaimPaidPayosOrder: mocks.reclaimPaidPayosOrder,
}));
vi.mock("@/lib/fulfillment", () => ({
  runOrderFulfillment: mocks.runOrderFulfillment,
}));
vi.mock("@/lib/payment-review", () => ({
  notifyPaymentReview: mocks.notifyPaymentReview,
}));
vi.mock("@/lib/auth-throttle", () => ({ allowUserAction: mocks.allowUserAction }));
vi.mock("@/lib/checkout-handoff", () => ({
  clearCheckoutHandoff: mocks.clearCheckoutHandoff,
}));

import { GET } from "@/app/api/trang-thai-don/route";

const call = (query: string) =>
  GET(new Request(`https://hdi.test/api/trang-thai-don${query}`));

describe("GET /api/trang-thai-don", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.allowUserAction.mockResolvedValue(true);
    mocks.syncPayosOrderStatus.mockResolvedValue({ closed: false });
    mocks.syncPayosServiceOrderStatus.mockResolvedValue({ closed: false });
    mocks.reclaimPaidPayosOrder.mockResolvedValue({
      confirmed: false,
      reason: "PENDING",
    });
    mocks.reclaimPaidPayosServiceOrder.mockResolvedValue({
      confirmed: false,
      reason: "PENDING",
    });
  });

  it("từ chối khi chưa đăng nhập, trước khi chạm database", async () => {
    mocks.auth.mockResolvedValue(null);

    const response = await call("?donHang=100018");

    expect(response.status).toBe(401);
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.findServiceOrder).not.toHaveBeenCalled();
  });

  it("không bao giờ đọc đơn ngoài tài khoản đang đăng nhập", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.findFirst.mockResolvedValue({ id: "order-1", status: "pending" });

    await call("?donHang=100018");

    // userId nằm TRONG where, không phải kiểm sau khi đọc.
    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { code: 100018, userId: "user-1" },
      }),
    );
  });

  it("trả trạng thái đơn hàng kèm no-store", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.findFirst.mockResolvedValue({ id: "order-1", status: "paid" });

    const response = await call("?donHang=100018");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ trangThai: "paid" });
    expect(response.headers.get("cache-control")).toContain("no-store");
    // Đơn đã chốt thì không có gì để hỏi PayOS nữa.
    expect(mocks.syncPayosOrderStatus).not.toHaveBeenCalled();
    expect(mocks.reclaimPaidPayosOrder).not.toHaveBeenCalled();
    // …và cũng không còn phiên thanh toán nào để thu hồi. Đây là Route Handler
    // duy nhất chạy trên trang kết quả, nên đây là chỗ duy nhất xóa được dấu
    // trên đường trả tiền thành công.
    expect(mocks.clearCheckoutHandoff).toHaveBeenCalled();
  });

  it("hỏi PayOS trước khi trả lời cho một đơn còn chờ, và trả về trạng thái mới", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.findFirst.mockResolvedValue({ id: "order-1", status: "pending" });
    mocks.syncPayosOrderStatus.mockResolvedValue({ closed: true, as: "cancelled" });

    const response = await call("?donHang=100018");

    // Không có bước này, PaymentPoll đọc mãi một chuỗi "pending" không bao giờ
    // đổi: PayOS không gửi webhook nào cho việc hủy.
    expect(mocks.syncPayosOrderStatus).toHaveBeenCalledWith("order-1", {
      userId: "user-1",
    });
    // Link đã chết thì không cần hỏi tiếp "đã PAID chưa".
    expect(mocks.reclaimPaidPayosOrder).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({ trangThai: "cancelled" });
  });

  /**
   * Webhook không tới: link còn sống, đơn vẫn `pending`, nhưng PayOS đã báo PAID.
   * Đường tự chữa chính — poller hỏi thẳng rồi đẩy qua `processPayosPayment`.
   */
  it("xác nhận đơn khi PayOS báo PAID mà webhook không tới, rồi chạy giao hàng", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.findFirst.mockResolvedValue({ id: "order-1", status: "pending" });
    mocks.reclaimPaidPayosOrder.mockResolvedValue({
      confirmed: true,
      outcome: "succeeded",
      orderId: "order-1",
      fulfill: true,
      reclaimed: false,
    });

    const response = await call("?donHang=100018");

    expect(mocks.reclaimPaidPayosOrder).toHaveBeenCalledWith("order-1", {
      userId: "user-1",
    });
    expect(mocks.runOrderFulfillment).toHaveBeenCalledWith("order-1");
    expect(mocks.clearCheckoutHandoff).toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({ trangThai: "paid" });
  });

  /** PayOS PAID nhưng số tiền lệch → `requires_review`: đơn vẫn chờ, admin được báo. */
  it("báo đối soát và giữ pending khi lượt PAID cần người xem", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.findFirst.mockResolvedValue({ id: "order-1", status: "pending" });
    mocks.reclaimPaidPayosOrder.mockResolvedValue({
      confirmed: true,
      outcome: "requires_review",
      orderId: "order-1",
      fulfill: false,
      reclaimed: false,
      review: {
        label: "Đơn #100018",
        reason: "Số tiền không khớp",
        expectedVnd: 300_000,
        receivedVnd: 250_000,
        providerRef: "BANK-REF",
      },
    });

    const response = await call("?donHang=100018");

    expect(mocks.notifyPaymentReview).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "Số tiền không khớp" }),
    );
    expect(mocks.runOrderFulfillment).not.toHaveBeenCalled();
    expect(mocks.clearCheckoutHandoff).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({ trangThai: "pending" });
  });

  it("chạm trần đồng bộ thì lùi về đọc database, không phải trả lỗi", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.findFirst.mockResolvedValue({ id: "order-1", status: "pending" });
    mocks.allowUserAction.mockResolvedValue(false);

    const response = await call("?donHang=100018");

    expect(mocks.syncPayosOrderStatus).not.toHaveBeenCalled();
    expect(mocks.reclaimPaidPayosOrder).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ trangThai: "pending" });
    // Đơn vẫn đang chờ nên dấu bàn giao phải được giữ lại.
    expect(mocks.clearCheckoutHandoff).not.toHaveBeenCalled();
  });

  it("một lỗi ở bước đối soát PAID không thành 500 cho PaymentPoll", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.findFirst.mockResolvedValue({ id: "order-1", status: "pending" });
    mocks.reclaimPaidPayosOrder.mockRejectedValue(new Error("database unavailable"));

    const response = await call("?donHang=100018");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ trangThai: "pending" });
  });

  it("đơn không phải của mình trả 404 giống hệt đơn không tồn tại", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.findFirst.mockResolvedValue(null);

    const response = await call("?donHang=100018");

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "not_found" });
  });

  it("tính trạng thái đơn dịch vụ đã hết hạn là closed dù status vẫn pending", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.findServiceOrder.mockResolvedValue({
      id: "svc-1",
      status: "pending",
      expiresAt: new Date(Date.now() - 60_000),
    });

    const response = await call("?dichVu=" + "a".repeat(32));

    // Đây là lý do endpoint trả chuỗi trạng thái chứ không trả boolean: đơn đi
    // từ pending sang hết hạn theo thời gian mà cột status không đổi.
    await expect(response.json()).resolves.toEqual({ trangThai: "closed" });
  });

  it("xác nhận đơn dịch vụ khi PayOS báo PAID mà webhook không tới", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.findServiceOrder.mockResolvedValue({
      id: "svc-1",
      status: "pending",
      expiresAt: new Date(Date.now() + 60_000),
    });
    mocks.reclaimPaidPayosServiceOrder.mockResolvedValue({
      confirmed: true,
      outcome: "succeeded",
      serviceOrderId: "svc-1",
    });

    const response = await call("?dichVu=" + "a".repeat(32));

    expect(mocks.reclaimPaidPayosServiceOrder).toHaveBeenCalledWith("svc-1", {
      userId: "user-1",
    });
    await expect(response.json()).resolves.toEqual({ trangThai: "paid" });
  });

  it("từ chối mã đơn không phải số nguyên", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });

    const response = await call("?donHang=khong-phai-so");

    expect(response.status).toBe(400);
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });
});
