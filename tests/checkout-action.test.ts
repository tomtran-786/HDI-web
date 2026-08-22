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
  ensurePayosCheckout: vi.fn(),
  allowUserAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: mocks.findUnique } },
}));
vi.mock("@/lib/cart", () => ({
  readCartIds: mocks.readCartIds,
  writeCartIds: mocks.writeCartIds,
}));
vi.mock("@/lib/orders", () => ({ createOrder: mocks.createOrder }));
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
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
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
    expect(mocks.createOrder).toHaveBeenCalledWith("user-1", [
      "course-b",
      "course-a",
    ]);
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
});
