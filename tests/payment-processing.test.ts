import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  queryRaw: vi.fn(),
  paymentFindUnique: vi.fn(),
  paymentCreate: vi.fn(),
  itemFindMany: vi.fn(),
  orderUpdateMany: vi.fn(),
  confirmEnrollment: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: mocks.transaction },
}));
vi.mock("@/lib/enrollment", () => ({
  confirmEnrollment: mocks.confirmEnrollment,
}));

import { processPayosPayment } from "@/lib/orders";

describe("append-only PayOS event processing", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.queryRaw.mockResolvedValue([
      {
        id: "order-1",
        userId: "user-1",
        status: "pending",
        amountVnd: 1_000_000,
        expiresAt: new Date(Date.now() + 60_000),
        providerRef: "link-1",
      },
    ]);
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        $queryRaw: mocks.queryRaw,
        payment: {
          findUnique: mocks.paymentFindUnique,
          create: mocks.paymentCreate,
        },
        orderItem: { findMany: mocks.itemFindMany },
        order: { updateMany: mocks.orderUpdateMany },
      }),
    );
  });

  it("never reinterprets a requires-review reference as a successful payment", async () => {
    mocks.paymentFindUnique.mockResolvedValue({
      orderId: "order-1",
      status: "requires_review",
    });

    await expect(
      processPayosPayment({
        orderCode: 100001,
        amount: 1_000_000,
        currency: "VND",
        reference: "BANK-REF",
        paymentLinkId: "link-1",
        transactionDateTime: new Date().toISOString(),
        code: "00",
        payload: { corrected: true },
      }),
    ).resolves.toEqual({
      handled: true,
      outcome: "requires_review",
      orderId: "order-1",
    });
    expect(mocks.paymentCreate).not.toHaveBeenCalled();
    expect(mocks.itemFindMany).not.toHaveBeenCalled();
    expect(mocks.orderUpdateMany).not.toHaveBeenCalled();
    expect(mocks.confirmEnrollment).not.toHaveBeenCalled();
  });

  it("recovers a signed payment-link id while confirming the aggregate atomically", async () => {
    mocks.queryRaw.mockResolvedValue([
      {
        id: "order-1",
        userId: "user-1",
        status: "pending",
        amountVnd: 1_000_000,
        expiresAt: new Date(Date.now() + 60_000),
        providerRef: null,
      },
    ]);
    mocks.paymentFindUnique.mockResolvedValue(null);
    mocks.paymentCreate.mockResolvedValue({ id: "payment-1" });
    mocks.itemFindMany.mockResolvedValue([
      {
        enrollmentId: "enrollment-1",
        memberUserId: "user-1",
        enrollment: { userId: "user-1", status: "pending" },
      },
    ]);
    mocks.orderUpdateMany.mockResolvedValue({ count: 1 });
    mocks.confirmEnrollment.mockResolvedValue({ confirmed: true });

    await expect(
      processPayosPayment({
        orderCode: 100001,
        amount: 1_000_000,
        currency: "VND",
        reference: "BANK-RECOVERY",
        paymentLinkId: "signed-link-id",
        transactionDateTime: new Date().toISOString(),
        code: "00",
        payload: { signed: true },
      }),
    ).resolves.toMatchObject({ outcome: "succeeded", enrolled: 1, fulfill: true });
    expect(mocks.orderUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ providerRef: "signed-link-id" }),
      }),
    );
    expect(mocks.confirmEnrollment).toHaveBeenCalledWith(
      "enrollment-1",
      expect.anything(),
      expect.any(Date),
    );
  });

  /**
   * Đơn nhóm: người trả tiền là `order.userId`, còn ghi danh thuộc về từng
   * thành viên. So ghi danh với người TRẢ TIỀN sẽ đẩy mọi thanh toán nhóm vào
   * `requires_review` — tiền đã vào tài khoản mà không ai được cấp quyền.
   */
  it("xác nhận đơn nhóm có ghi danh thuộc nhiều người khác nhau", async () => {
    mocks.paymentFindUnique.mockResolvedValue(null);
    mocks.paymentCreate.mockResolvedValue({ id: "payment-1" });
    mocks.itemFindMany.mockResolvedValue([
      {
        enrollmentId: "enrollment-1",
        memberUserId: "user-1",
        enrollment: { userId: "user-1", status: "pending" },
      },
      {
        enrollmentId: "enrollment-2",
        memberUserId: "user-2",
        enrollment: { userId: "user-2", status: "pending" },
      },
      {
        enrollmentId: "enrollment-3",
        memberUserId: "user-3",
        enrollment: { userId: "user-3", status: "pending" },
      },
    ]);
    mocks.orderUpdateMany.mockResolvedValue({ count: 1 });
    mocks.confirmEnrollment.mockResolvedValue({ confirmed: true });

    await expect(
      processPayosPayment({
        orderCode: 100001,
        amount: 1_000_000,
        currency: "VND",
        reference: "BANK-GROUP",
        paymentLinkId: "link-1",
        transactionDateTime: new Date().toISOString(),
        code: "00",
        payload: { signed: true },
      }),
    ).resolves.toMatchObject({ outcome: "succeeded", enrolled: 3, fulfill: true });
    expect(mocks.confirmEnrollment).toHaveBeenCalledTimes(3);
  });

  /**
   * Ràng buộc chặt hơn bản cũ: một dòng đơn bị gắn nhầm sang ghi danh của người
   * khác trong cùng nhóm phải bị giữ lại để người thật xem, chứ không được tự
   * cấp quyền cho nhầm người.
   */
  it("giữ lại để kiểm tra khi ghi danh không thuộc người được khai trên dòng đơn", async () => {
    mocks.paymentFindUnique.mockResolvedValue(null);
    mocks.paymentCreate.mockResolvedValue({ id: "payment-1" });
    mocks.itemFindMany.mockResolvedValue([
      {
        enrollmentId: "enrollment-1",
        memberUserId: "user-2",
        enrollment: { userId: "user-3", status: "pending" },
      },
    ]);

    await expect(
      processPayosPayment({
        orderCode: 100001,
        amount: 1_000_000,
        currency: "VND",
        reference: "BANK-MISMATCH",
        paymentLinkId: "link-1",
        transactionDateTime: new Date().toISOString(),
        code: "00",
        payload: { signed: true },
      }),
    ).resolves.toMatchObject({ outcome: "requires_review" });
    expect(mocks.confirmEnrollment).not.toHaveBeenCalled();
  });
});
