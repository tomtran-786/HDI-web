import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  updateMany: vi.fn(),
  create: vi.fn(),
  get: vi.fn(),
  cancelOrder: vi.fn(),
  isNotFound: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { order: { findFirst: mocks.findFirst, updateMany: mocks.updateMany } },
}));
vi.mock("@/lib/payos", () => ({
  payosClient: () => ({ paymentRequests: { create: mocks.create, get: mocks.get } }),
  isPayosNotFound: mocks.isNotFound,
}));
vi.mock("@/lib/orders", () => ({ cancelOrder: mocks.cancelOrder }));
vi.mock("@/lib/app-url", () => ({ appUrl: () => "https://hdi.test" }));

import { ensurePayosCheckout } from "@/lib/payment-checkout";

const order = {
  id: "order-1",
  code: 100001,
  status: "pending",
  amountVnd: 1_000_000,
  expiresAt: new Date(Date.now() + 60_000),
  checkoutUrl: null,
  user: { name: "Học viên", email: "student@example.com", phone: "0900000000" },
  items: [{ priceVnd: 1_000_000, course: { slug: "course" } }],
};

describe("PayOS checkout creation", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.isNotFound.mockReturnValue(false);
  });

  it("reuses a stored hosted link without another provider call", async () => {
    mocks.findFirst.mockResolvedValue({ ...order, checkoutUrl: "https://payos.test/link" });
    await expect(ensurePayosCheckout("order-1", "user-1")).resolves.toEqual({
      ok: true,
      state: "ready",
      checkoutUrl: "https://payos.test/link",
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("sends only server-owned price/order data and persists the returned link", async () => {
    mocks.findFirst.mockResolvedValue(order);
    mocks.create.mockResolvedValue({
      paymentLinkId: "payos-link-id",
      checkoutUrl: "https://payos.test/link",
    });
    mocks.updateMany.mockResolvedValue({ count: 1 });
    const result = await ensurePayosCheckout("order-1", "user-1");
    expect(result).toEqual({
      ok: true,
      state: "ready",
      checkoutUrl: "https://payos.test/link",
    });
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        orderCode: 100001,
        amount: 1_000_000,
        description: "100001 0900000000",
        items: [{ name: "course", quantity: 1, price: 1_000_000 }],
      }),
    );
    expect(mocks.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ providerRef: "payos-link-id" }),
      }),
    );
  });

  it("normalizes a +84 phone before building the transfer description", async () => {
    mocks.findFirst.mockResolvedValue({
      ...order,
      user: { ...order.user, phone: "+84912345678" },
    });
    mocks.create.mockResolvedValue({
      paymentLinkId: "payos-link-id",
      checkoutUrl: "https://payos.test/link",
    });
    mocks.updateMany.mockResolvedValue({ count: 1 });

    await ensurePayosCheckout("order-1", "user-1");

    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ description: "100001 0912345678" }),
    );
  });

  it("does not contact PayOS when a new link has no valid phone", async () => {
    mocks.findFirst.mockResolvedValue({
      ...order,
      user: { ...order.user, phone: null },
    });

    await expect(ensurePayosCheckout("order-1", "user-1")).resolves.toEqual({
      ok: false,
      state: "invalid_profile",
      message:
        "Số điện thoại trong hồ sơ chưa hợp lệ. Vui lòng cập nhật hồ sơ trước khi thanh toán.",
    });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("recovers evidence of an existing link after an uncertain create error", async () => {
    mocks.findFirst.mockResolvedValue(order);
    mocks.create.mockRejectedValue(new Error("response lost"));
    mocks.get.mockResolvedValue({ id: "payos-link-id", status: "PENDING" });
    mocks.updateMany.mockResolvedValue({ count: 1 });

    await expect(ensurePayosCheckout("order-1", "user-1")).resolves.toEqual({
      ok: false,
      state: "pending_gateway",
      message:
        "PayOS đã nhận đơn nhưng chưa trả lại đường dẫn. Vui lòng mở lại đơn sau ít phút.",
    });
    expect(mocks.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ providerRef: "payos-link-id" }),
      }),
    );
    expect(mocks.cancelOrder).not.toHaveBeenCalled();
  });

  it("closes the local order only when PayOS confirms the link is absent", async () => {
    const notFound = new Error("not found");
    mocks.findFirst.mockResolvedValue(order);
    mocks.create.mockRejectedValue(new Error("create failed"));
    mocks.get.mockRejectedValue(notFound);
    mocks.isNotFound.mockImplementation((error) => error === notFound);
    mocks.cancelOrder.mockResolvedValue({ cancelled: true, released: 1 });

    await expect(ensurePayosCheckout("order-1", "user-1")).resolves.toEqual({
      ok: false,
      state: "closed",
      message: "Chưa tạo được liên kết PayOS. Vui lòng thử đặt đơn lại.",
    });
    expect(mocks.cancelOrder).toHaveBeenCalledWith("order-1", {
      userId: "user-1",
      as: "cancelled",
    });
  });

  it("keeps the order pending when PayOS cannot be reached", async () => {
    mocks.findFirst.mockResolvedValue(order);
    mocks.create.mockRejectedValue(new Error("create unavailable"));
    mocks.get.mockRejectedValue(new Error("lookup unavailable"));

    await expect(ensurePayosCheckout("order-1", "user-1")).resolves.toEqual({
      ok: false,
      state: "pending_gateway",
      message:
        "PayOS đang gián đoạn. Đơn vẫn được giữ an toàn; vui lòng mở lại sau.",
    });
    expect(mocks.cancelOrder).not.toHaveBeenCalled();
  });
});
