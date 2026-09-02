import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findFirst: vi.fn(),
  findServiceOrder: vi.fn(),
  syncPayosOrderStatus: vi.fn(),
  syncPayosServiceOrderStatus: vi.fn(),
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
  };
});
vi.mock("@/lib/orders", () => ({
  syncPayosOrderStatus: mocks.syncPayosOrderStatus,
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
    await expect(response.json()).resolves.toEqual({ trangThai: "cancelled" });
  });

  it("chạm trần đồng bộ thì lùi về đọc database, không phải trả lỗi", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.findFirst.mockResolvedValue({ id: "order-1", status: "pending" });
    mocks.allowUserAction.mockResolvedValue(false);

    const response = await call("?donHang=100018");

    expect(mocks.syncPayosOrderStatus).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ trangThai: "pending" });
    // Đơn vẫn đang chờ nên dấu bàn giao phải được giữ lại.
    expect(mocks.clearCheckoutHandoff).not.toHaveBeenCalled();
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

  it("từ chối mã đơn không phải số nguyên", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });

    const response = await call("?donHang=khong-phai-so");

    expect(response.status).toBe(400);
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });
});
