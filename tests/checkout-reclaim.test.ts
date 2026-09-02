import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  orderFindFirst: vi.fn(),
  serviceFindFirst: vi.fn(),
  cancelOrder: vi.fn(),
  cancelServiceOrder: vi.fn(),
  allowUserAction: vi.fn(),
  readCheckoutHandoff: vi.fn(),
  clearCheckoutHandoff: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: { findFirst: mocks.orderFindFirst },
    serviceOrder: { findFirst: mocks.serviceFindFirst },
  },
}));
vi.mock("@/lib/orders", () => ({ cancelOrder: mocks.cancelOrder }));
vi.mock("@/lib/service-orders", () => ({
  cancelServiceOrder: mocks.cancelServiceOrder,
}));
vi.mock("@/lib/auth-throttle", () => ({ allowUserAction: mocks.allowUserAction }));
vi.mock("@/lib/checkout-handoff", () => ({
  readCheckoutHandoff: mocks.readCheckoutHandoff,
  clearCheckoutHandoff: mocks.clearCheckoutHandoff,
}));
vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag }));

import { POST } from "@/app/api/thanh-toan/roi-trang/route";

/**
 * Endpoint thu hồi một phiên thanh toán bị bỏ dở.
 *
 * PayOS chỉ gọi về `cancelUrl` khi học viên bấm đúng nút "Hủy"; đóng tab, bấm
 * Back, hay để app ngân hàng nuốt deep link đều không sinh tín hiệu nào. Trước
 * khi có đường này, những đơn đó giữ ghế, giữ credits và giữ suất giảm giá "đơn
 * đầu tiên" của chính người mua cho tới lượt cron 03:00 hôm sau.
 */
describe("POST /api/thanh-toan/roi-trang", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.allowUserAction.mockResolvedValue(true);
    mocks.readCheckoutHandoff.mockResolvedValue({ kind: "order", key: "100001" });
    mocks.orderFindFirst.mockResolvedValue({ id: "order-1", code: 100001 });
    mocks.cancelOrder.mockResolvedValue({ cancelled: true, released: 1 });
  });

  it("từ chối khi chưa đăng nhập, trước khi chạm cookie hay database", async () => {
    mocks.auth.mockResolvedValue(null);

    const response = await POST();

    expect(response.status).toBe(401);
    expect(mocks.readCheckoutHandoff).not.toHaveBeenCalled();
    expect(mocks.cancelOrder).not.toHaveBeenCalled();
  });

  it("không làm gì khi trình duyệt không mang dấu bàn giao nào", async () => {
    mocks.readCheckoutHandoff.mockResolvedValue(null);

    await expect((await POST()).json()).resolves.toEqual({ huy: false });
    expect(mocks.orderFindFirst).not.toHaveBeenCalled();
    expect(mocks.cancelOrder).not.toHaveBeenCalled();
  });

  it("hủy đơn và trả ghế, rồi làm mới bộ đếm ghế công khai", async () => {
    const response = await POST();

    expect(mocks.cancelOrder).toHaveBeenCalledWith("order-1", { userId: "user-1" });
    await expect(response.json()).resolves.toMatchObject({
      huy: true,
      loai: "order",
      code: 100001,
      orderId: "order-1",
    });
    // Route Handler nên `revalidateTag` dùng được ở đây — khác /thanh-toan/huy,
    // nơi việc hủy xảy ra lúc render page và bộ đếm phải chờ hết cache 300s.
    expect(mocks.revalidateTag).toHaveBeenCalled();
  });

  it("chỉ tìm đơn của chính người đang đăng nhập, không tin cookie", async () => {
    await POST();

    // Giá trị trong cookie do trình duyệt nắm, nên nó chỉ được dùng để TÌM đơn
    // của người này chứ không bao giờ để chứng minh quyền sở hữu.
    expect(mocks.orderFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { code: 100001, userId: "user-1", status: "pending" },
      }),
    );
  });

  it("không hủy gì khi PayOS đang giữ tiền", async () => {
    mocks.cancelOrder.mockResolvedValue({
      cancelled: false,
      released: 0,
      reason: "payment_in_progress",
    });

    await expect((await POST()).json()).resolves.toMatchObject({
      huy: false,
      lyDo: "payment_in_progress",
    });
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });

  it("xóa dấu bàn giao TRƯỚC khi gọi PayOS, để ba trang liên tiếp không thành ba lượt hủy", async () => {
    await POST();

    expect(mocks.clearCheckoutHandoff).toHaveBeenCalled();
    expect(mocks.clearCheckoutHandoff.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.cancelOrder.mock.invocationCallOrder[0]!,
    );
  });

  it("vẫn xóa dấu khi không còn đơn nào đang chờ", async () => {
    mocks.orderFindFirst.mockResolvedValue(null);

    await expect((await POST()).json()).resolves.toEqual({ huy: false });
    expect(mocks.clearCheckoutHandoff).toHaveBeenCalled();
    expect(mocks.cancelOrder).not.toHaveBeenCalled();
  });

  it("chạm trần thì không gọi PayOS và giữ nguyên dấu để lượt sau thử lại", async () => {
    mocks.allowUserAction.mockResolvedValue(false);

    await expect((await POST()).json()).resolves.toEqual({
      huy: false,
      lyDo: "throttled",
    });
    expect(mocks.clearCheckoutHandoff).not.toHaveBeenCalled();
    expect(mocks.cancelOrder).not.toHaveBeenCalled();
  });

  it("đi đúng nhánh đơn dịch vụ khi dấu bàn giao là một `ref`", async () => {
    const ref = "a".repeat(32);
    mocks.readCheckoutHandoff.mockResolvedValue({ kind: "service", key: ref });
    mocks.serviceFindFirst.mockResolvedValue({ id: "svc-1", code: 900000001 });
    mocks.cancelServiceOrder.mockResolvedValue({ cancelled: true });

    await expect((await POST()).json()).resolves.toMatchObject({
      huy: true,
      loai: "service",
      code: 900000001,
    });
    expect(mocks.cancelServiceOrder).toHaveBeenCalledWith("svc-1", {
      userId: "user-1",
    });
    expect(mocks.cancelOrder).not.toHaveBeenCalled();
    // Đơn dịch vụ không giữ ghế của ai nên không có gì để làm mới.
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });
});
