import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  transaction: vi.fn(),
  orderUpdateMany: vi.fn(),
  itemFindMany: vi.fn(),
  enrollmentUpdateMany: vi.fn(),
  ledgerUpdateMany: vi.fn(),
  get: vi.fn(),
  cancel: vi.fn(),
  isNotFound: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: { findFirst: mocks.findFirst },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/lib/payos", () => ({
  payosClient: () => ({
    paymentRequests: { get: mocks.get, cancel: mocks.cancel },
  }),
  isPayosNotFound: mocks.isNotFound,
}));

import { cancelOrder } from "@/lib/orders";

const pendingOrder = {
  id: "order-1",
  code: 100001,
  provider: "payos",
};

describe("remote-first PayOS cancellation", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.findFirst.mockResolvedValue(pendingOrder);
    mocks.isNotFound.mockReturnValue(false);
    mocks.orderUpdateMany.mockResolvedValue({ count: 1 });
    mocks.itemFindMany.mockResolvedValue([{ enrollmentId: "enrollment-1" }]);
    mocks.enrollmentUpdateMany.mockResolvedValue({ count: 1 });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        order: { updateMany: mocks.orderUpdateMany },
        orderItem: { findMany: mocks.itemFindMany },
        enrollment: { updateMany: mocks.enrollmentUpdateMany },
        referralLedger: { updateMany: mocks.ledgerUpdateMany },
      }),
    );
  });

  it("cancels a pending provider link before releasing the local seat", async () => {
    mocks.get.mockResolvedValue({ status: "PENDING" });
    mocks.cancel.mockResolvedValue({ status: "CANCELLED" });

    await expect(
      cancelOrder("order-1", { userId: "user-1" }),
    ).resolves.toEqual({ cancelled: true, released: 1 });
    expect(mocks.cancel).toHaveBeenCalledWith(100001, "Học viên hủy đơn");
    expect(mocks.cancel.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.transaction.mock.invocationCallOrder[0]!,
    );
  });

  it("fails closed when the gateway is unreachable", async () => {
    mocks.get.mockRejectedValue(new Error("gateway unavailable"));

    await expect(cancelOrder("order-1")).resolves.toEqual({
      cancelled: false,
      released: 0,
      reason: "gateway_unavailable",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("does not release a seat for paid-like provider states", async () => {
    mocks.get.mockResolvedValue({ status: "PROCESSING" });

    await expect(cancelOrder("order-1")).resolves.toEqual({
      cancelled: false,
      released: 0,
      reason: "payment_in_progress",
    });
    expect(mocks.cancel).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("may close locally after PayOS confirms that no link exists", async () => {
    const notFound = new Error("not found");
    mocks.get.mockRejectedValue(notFound);
    mocks.isNotFound.mockImplementation((error) => error === notFound);

    await expect(
      cancelOrder("order-1", { as: "expired" }),
    ).resolves.toEqual({ cancelled: true, released: 1 });
    expect(mocks.orderUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "order-1", status: "pending" },
        data: expect.objectContaining({ status: "expired" }),
      }),
    );
  });
});
