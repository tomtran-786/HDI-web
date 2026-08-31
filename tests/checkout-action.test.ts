import { beforeEach, describe, expect, it, vi } from "vitest";

class RedirectSignal extends Error {
  constructor(readonly url: string) {
    super(url);
  }
}

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  redirect: vi.fn(),
  findUnique: vi.fn(),
  readCartIds: vi.fn(),
  writeCartIds: vi.fn(),
  createOrder: vi.fn(),
  cancelOrder: vi.fn(),
  resolveGroupMembers: vi.fn(),
  ensurePayosCheckout: vi.fn(),
  allowUserAction: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: mocks.findUnique } },
}));
vi.mock("@/lib/cart", () => ({
  readCartIds: mocks.readCartIds,
  writeCartIds: mocks.writeCartIds,
}));
vi.mock("@/lib/orders", () => ({
  createOrder: mocks.createOrder,
  cancelOrder: mocks.cancelOrder,
}));
vi.mock("@/lib/group-members", async (importOriginal) => ({
  // `normalizeMemberEmails` là hàm thuần, để chạy thật; chỉ chặn phần tra database.
  ...(await importOriginal<typeof import("@/lib/group-members")>()),
  resolveGroupMembers: mocks.resolveGroupMembers,
}));
vi.mock("@/lib/auth-throttle", () => ({ allowUserAction: mocks.allowUserAction }));
vi.mock("@/lib/payment-checkout", () => ({
  ensurePayosCheckout: mocks.ensurePayosCheckout,
}));

import { checkout } from "@/app/actions/checkout";

describe("one-step cart checkout action", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.redirect.mockImplementation((url: string) => {
      throw new RedirectSignal(url);
    });
    mocks.auth.mockResolvedValue({
      user: { id: "user-1", email: "leader@hdi.test" },
    });
    mocks.resolveGroupMembers.mockResolvedValue({ members: [], unregistered: [] });
    mocks.findUnique.mockResolvedValue({ phone: "0900000000", stage: "other" });
    mocks.readCartIds.mockResolvedValue(["course-b", "course-a"]);
    mocks.allowUserAction.mockResolvedValue(true);
  });

  it("passes the complete cookie basket to server pricing and redirects to PayOS", async () => {
    mocks.createOrder.mockResolvedValue({
      ok: true,
      orderId: "order-1",
      code: 100001,
      amountVnd: 900_000,
      expiresAt: new Date(),
    });
    mocks.ensurePayosCheckout.mockResolvedValue({
      ok: true,
      state: "ready",
      checkoutUrl: "https://payos.test/checkout",
    });
    const forged = new FormData();
    forged.set("amountVnd", "1");
    forged.set("courseId", "attacker-course");

    await expect(checkout({}, forged)).rejects.toMatchObject({
      url: "https://payos.test/checkout",
    });
    expect(mocks.createOrder).toHaveBeenCalledWith(
      "user-1",
      ["course-b", "course-a"],
      { members: [], useCredit: false },
    );
    expect(mocks.writeCartIds).toHaveBeenCalledWith([]);
  });

  it("keeps the basket and returns a modal error when any course fails", async () => {
    mocks.createOrder.mockResolvedValue({
      ok: false,
      reason: "no_seats",
      message: "Một khóa đã hết chỗ.",
    });

    await expect(checkout({}, new FormData())).resolves.toEqual({
      error: "Một khóa đã hết chỗ.",
      refreshCatalog: true,
    });
    expect(mocks.ensurePayosCheckout).not.toHaveBeenCalled();
    expect(mocks.writeCartIds).not.toHaveBeenCalled();
  });

  it("falls back to the existing order when PayOS has no URL yet", async () => {
    mocks.createOrder.mockResolvedValue({
      ok: true,
      orderId: "order-1",
      code: 100001,
      amountVnd: 900_000,
      expiresAt: new Date(),
    });
    mocks.ensurePayosCheckout.mockResolvedValue({
      ok: false,
      state: "pending_gateway",
      message: "PayOS chưa trả URL.",
    });

    await expect(checkout({}, new FormData())).rejects.toMatchObject({
      url: "/tai-khoan/don-hang/100001",
    });
    expect(mocks.writeCartIds).toHaveBeenCalledWith([]);
  });
  it("từ chối trước khi khóa hàng nào khi người dùng bấm đặt đơn quá nhiều lần", async () => {
    mocks.allowUserAction.mockResolvedValue(false);

    const state = await checkout({}, new FormData());

    expect(state.error).toMatch(/quá nhiều lần/);
    expect(state.refreshCatalog).toBe(true);
    // Điểm mấu chốt: từ chối phải xảy ra TRƯỚC createOrder, nếu không thì mỗi
    // lần bấm vẫn khóa hàng courses và tạo enrolment rồi mới bị chặn.
    expect(mocks.createOrder).not.toHaveBeenCalled();
    expect(mocks.ensurePayosCheckout).not.toHaveBeenCalled();
  });

  it("phân giải email thành viên rồi truyền xuống server pricing", async () => {
    mocks.resolveGroupMembers.mockResolvedValue({
      members: [
        { id: "user-2", email: "b@hdi.test" },
        { id: "user-3", email: "c@hdi.test" },
      ],
      unregistered: [],
    });
    mocks.createOrder.mockResolvedValue({
      ok: true,
      orderId: "order-1",
      code: 100001,
      amountVnd: 750_000,
      groupSize: 3,
      expiresAt: new Date(),
    });
    mocks.ensurePayosCheckout.mockResolvedValue({
      ok: true,
      state: "ready",
      checkoutUrl: "https://payos.test/checkout",
    });

    const form = new FormData();
    form.append("thanhVien", "b@hdi.test");
    form.append("thanhVien", "c@hdi.test");
    form.set("tongTienDuKien", "750000");

    await expect(checkout({}, form)).rejects.toMatchObject({
      url: "https://payos.test/checkout",
    });
    expect(mocks.createOrder).toHaveBeenCalledWith(
      "user-1",
      ["course-b", "course-a"],
      {
        members: [
          { id: "user-2", email: "b@hdi.test" },
          { id: "user-3", email: "c@hdi.test" },
        ],
        useCredit: false,
      },
    );
  });

  it("từ chối trước khi giữ chỗ khi có email chưa có tài khoản", async () => {
    mocks.resolveGroupMembers.mockResolvedValue({
      members: [],
      unregistered: ["chua-co@hdi.test"],
    });

    const form = new FormData();
    form.append("thanhVien", "chua-co@hdi.test");

    const result = await checkout({}, form);
    expect(result.error).toContain("chua-co@hdi.test");
    // Không được tạo ghi danh giữ chỗ cho một nhóm chắc chắn sẽ bị từ chối.
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });

  /**
   * Bảng giá hoặc số người có thể đổi giữa lúc giỏ hàng báo giá và lúc ghi đơn.
   * Đơn đã tạo phải bị hủy chứ không để lại: nó đang giữ ghế và sắp có một link
   * PayOS mang con số học viên chưa từng đồng ý.
   */
  it("hủy đơn vừa tạo khi số tiền lệch với con số học viên đã thấy", async () => {
    mocks.createOrder.mockResolvedValue({
      ok: true,
      orderId: "order-1",
      code: 100001,
      amountVnd: 900_000,
      groupSize: 1,
      expiresAt: new Date(),
    });

    const form = new FormData();
    form.set("tongTienDuKien", "750000");

    mocks.cancelOrder.mockResolvedValue({ cancelled: true, released: 1 });

    const result = await checkout({}, form);
    expect(result.refreshCatalog).toBe(true);
    expect(result.error).toContain("thay đổi");
    expect(mocks.cancelOrder).toHaveBeenCalledWith("order-1", { userId: "user-1" });
    expect(mocks.ensurePayosCheckout).not.toHaveBeenCalled();
    expect(mocks.writeCartIds).not.toHaveBeenCalled();
  });

  /**
   * Rollback chốt giá có thể KHÔNG thành: PayOS chập, hoặc link đã nhận tiền.
   * Khi đó đơn vừa tạo vẫn đang giữ ghế, giữ credits và giữ suất giảm giá "đơn
   * đầu tiên" của chính người này — nên bảo họ "kiểm tra lại giỏ hàng" là chỉ
   * sai đường: quay lại giỏ sẽ ra một con số khác nữa, vì số dư credits đang bị
   * chính đơn treo kia trừ mất.
   */
  it("đưa học viên tới trang đơn khi không hủy được đơn vừa tạo", async () => {
    mocks.createOrder.mockResolvedValue({
      ok: true,
      orderId: "order-1",
      code: 100001,
      amountVnd: 900_000,
      groupSize: 1,
      expiresAt: new Date(),
    });
    mocks.cancelOrder.mockResolvedValue({
      cancelled: false,
      released: 0,
      reason: "gateway_unavailable",
    });

    const form = new FormData();
    form.set("tongTienDuKien", "750000");

    await expect(checkout({}, form)).rejects.toMatchObject({
      url: "/tai-khoan/don-hang/100001",
    });
    // Giỏ giữ nguyên: đơn treo có thể được hủy từ trang kia, và khi đó người mua
    // cần giỏ của mình còn nguyên để thử lại.
    expect(mocks.writeCartIds).not.toHaveBeenCalled();
    expect(mocks.ensurePayosCheckout).not.toHaveBeenCalled();
  });
});
