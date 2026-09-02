import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cứu một khoản tiền PayOS về sau hạn giữ chỗ.
 *
 * `classifyPayosPayment` trả `requires_review` khi giao dịch xảy ra sau
 * `order.expiresAt` hoặc khi đơn đã bị một lượt quét đóng thành `expired`. Nếu
 * thứ duy nhất vướng là cái đó — mọi điều kiện khác sạch và khóa vẫn còn ghế —
 * `processPayosPayment` mở lại đơn thay vì đẩy vào hàng đối soát thủ công.
 */

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  queryRaw: vi.fn(),
  paymentFindUnique: vi.fn(),
  paymentCreate: vi.fn(),
  paymentUpdateMany: vi.fn(),
  itemFindMany: vi.fn(),
  orderUpdateMany: vi.fn(),
  userFindUnique: vi.fn(),
  enrollmentFindFirst: vi.fn(),
  ledgerFindFirst: vi.fn(),
  ledgerUpdateMany: vi.fn(),
  ledgerAggregate: vi.fn(),
  confirmEnrollments: vi.fn(),
  reactivateEnrollments: vi.fn(),
  // Điều chỉnh theo từng test.
  lockedOrder: { current: [] as unknown[] },
  heldSeats: { current: [] as unknown[] },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: mocks.transaction },
}));
vi.mock("@/lib/enrollment", () => ({
  confirmEnrollments: mocks.confirmEnrollments,
  reactivateEnrollments: mocks.reactivateEnrollments,
}));

import { grantReviewedPayment, processPayosPayment } from "@/lib/orders";

const HOUR = 3_600_000;

function lateEvent(overrides: Record<string, unknown> = {}) {
  return {
    orderCode: 100032,
    amount: 1_000_000,
    currency: "VND",
    reference: "BANK-LATE",
    paymentLinkId: "link-1",
    // 7 giờ sau khi tạo đơn — quá mốc giữ chỗ 6 giờ, trong khoảng ân hạn 90'.
    transactionDateTime: new Date(Date.now() - 0).toISOString(),
    code: "00",
    payload: { late: true },
    ...overrides,
  };
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    if (typeof (mock as { mockReset?: () => void }).mockReset === "function") {
      (mock as { mockReset: () => void }).mockReset();
    }
  }

  // Đơn được tạo 7 giờ trước, hạn giữ chỗ đã trôi 1 giờ. Giao dịch xảy ra "bây
  // giờ" — sau hạn nhưng còn trong khoảng ân hạn.
  const createdAgo = 7 * HOUR;
  mocks.lockedOrder.current = [
    {
      id: "order-1",
      userId: "user-1",
      status: "expired",
      amountVnd: 1_000_000,
      creditAppliedVnd: 0,
      expiresAt: new Date(Date.now() - createdAgo + 6 * HOUR),
      providerRef: "link-1",
    },
  ];
  mocks.heldSeats.current = []; // khóa trống

  mocks.userFindUnique.mockResolvedValue({ referredById: null });
  mocks.paymentFindUnique.mockResolvedValue(null);
  mocks.paymentCreate.mockResolvedValue({ id: "payment-1" });
  mocks.paymentUpdateMany.mockResolvedValue({ count: 1 });
  mocks.orderUpdateMany.mockResolvedValue({ count: 1 });
  mocks.enrollmentFindFirst.mockResolvedValue(null); // không có ghi danh nào khác
  mocks.ledgerFindFirst.mockResolvedValue(null);
  mocks.ledgerUpdateMany.mockResolvedValue({ count: 0 });
  mocks.ledgerAggregate.mockResolvedValue({ _sum: { amountVnd: 0 } });
  mocks.confirmEnrollments.mockResolvedValue({ confirmed: 1 });
  mocks.reactivateEnrollments.mockResolvedValue({ confirmed: 1 });
  mocks.itemFindMany.mockResolvedValue([
    {
      enrollmentId: "enrollment-1",
      memberUserId: "user-1",
      courseId: "course-1",
      course: { capacity: 20 },
      enrollment: { userId: "user-1", status: "cancelled" },
    },
  ]);

  mocks.queryRaw.mockImplementation((strings: TemplateStringsArray) => {
    const sql = Array.from(strings).join(" ");
    if (sql.includes("FROM orders")) return Promise.resolve(mocks.lockedOrder.current);
    if (sql.includes("FROM users")) return Promise.resolve([{ id: "user-1" }]);
    if (sql.includes("count(*)")) return Promise.resolve(mocks.heldSeats.current);
    return Promise.resolve([]);
  });

  mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
    callback({
      $queryRaw: mocks.queryRaw,
      payment: {
        findUnique: mocks.paymentFindUnique,
        create: mocks.paymentCreate,
        updateMany: mocks.paymentUpdateMany,
      },
      orderItem: { findMany: mocks.itemFindMany },
      order: { updateMany: mocks.orderUpdateMany },
      user: { findUnique: mocks.userFindUnique },
      enrollment: { findFirst: mocks.enrollmentFindFirst },
      referralLedger: {
        findFirst: mocks.ledgerFindFirst,
        updateMany: mocks.ledgerUpdateMany,
        aggregate: mocks.ledgerAggregate,
      },
    }),
  );
});

describe("late-payment reclaim", () => {
  it("mở lại một đơn đã expired khi tiền về muộn mà khóa còn ghế", async () => {
    const result = await processPayosPayment(lateEvent());

    expect(result).toMatchObject({
      outcome: "succeeded",
      reclaimed: true,
      fulfill: true,
    });
    // Ghi danh đã bị lượt quét hủy -> phải dùng reactivateEnrollments, không
    // phải confirmEnrollments (chỉ nhận `pending`).
    expect(mocks.reactivateEnrollments).toHaveBeenCalledWith(
      ["enrollment-1"],
      expect.anything(),
      expect.any(Date),
    );
    expect(mocks.confirmEnrollments).not.toHaveBeenCalled();
    // Hàng payments được ghi thẳng là `succeeded`.
    expect(mocks.paymentCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "succeeded" }) }),
    );
    // Điều kiện flip đơn được nới sang gồm cả `expired`.
    expect(mocks.orderUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { in: ["pending", "expired"] } }),
      }),
    );
  });

  it("cũng cứu khi đơn vẫn pending nhưng giao dịch sau hạn", async () => {
    mocks.lockedOrder.current = [
      { ...(mocks.lockedOrder.current[0] as object), status: "pending" },
    ];
    mocks.itemFindMany.mockResolvedValue([
      {
        enrollmentId: "enrollment-1",
        memberUserId: "user-1",
        courseId: "course-1",
        course: { capacity: 20 },
        enrollment: { userId: "user-1", status: "pending" },
      },
    ]);

    const result = await processPayosPayment(lateEvent());
    expect(result).toMatchObject({ outcome: "succeeded", reclaimed: true });
  });

  it("KHÔNG cứu khi khóa đã hết chỗ — vào đối soát thủ công", async () => {
    mocks.heldSeats.current = [{ courseId: "course-1", held: BigInt(20) }];

    const result = await processPayosPayment(lateEvent());
    expect(result).toMatchObject({ outcome: "requires_review" });
    expect(result).not.toHaveProperty("reclaimed", true);
    expect(mocks.reactivateEnrollments).not.toHaveBeenCalled();
    expect(mocks.paymentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "requires_review" }),
      }),
    );
  });

  it("KHÔNG cứu khi giao dịch quá xa hạn đơn (ngoài khoảng ân hạn)", async () => {
    // Hạn đơn đã trôi 5 giờ — vượt xa 90 phút ân hạn.
    mocks.lockedOrder.current = [
      {
        ...(mocks.lockedOrder.current[0] as object),
        expiresAt: new Date(Date.now() - 5 * HOUR),
      },
    ];

    const result = await processPayosPayment(lateEvent());
    expect(result).toMatchObject({ outcome: "requires_review" });
    expect(mocks.reactivateEnrollments).not.toHaveBeenCalled();
  });

  it("KHÔNG cứu khi đã có ghi danh hiệu lực khác cho cùng khóa", async () => {
    mocks.enrollmentFindFirst.mockResolvedValue({ id: "enrollment-other" });

    const result = await processPayosPayment(lateEvent());
    expect(result).toMatchObject({ outcome: "requires_review" });
  });

  it("KHÔNG cứu khi số tiền không khớp — đó là ca đối soát thật", async () => {
    const result = await processPayosPayment(lateEvent({ amount: 999_999 }));
    expect(result).toMatchObject({ outcome: "requires_review" });
    expect(mocks.reactivateEnrollments).not.toHaveBeenCalled();
  });

  it("cứu được đơn có dùng credits khi số dư vẫn phủ được phần đã giữ chỗ", async () => {
    mocks.lockedOrder.current = [
      { ...(mocks.lockedOrder.current[0] as object), creditAppliedVnd: 200_000 },
    ];
    // Lượt quét đã trả khoản giữ chỗ về ví -> hàng `void`; số dư hiện tại 200k.
    mocks.ledgerFindFirst.mockResolvedValue({ status: "void" });
    mocks.ledgerAggregate.mockResolvedValue({ _sum: { amountVnd: 200_000 } });

    const result = await processPayosPayment(lateEvent());
    expect(result).toMatchObject({ outcome: "succeeded", reclaimed: true });
    // Khoản giữ chỗ được trừ lại: void -> applied.
    expect(mocks.ledgerUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "applied" }),
      }),
    );
  });

  it("KHÔNG cứu đơn có dùng credits khi số dư đã bị tiêu cho đơn khác", async () => {
    mocks.lockedOrder.current = [
      { ...(mocks.lockedOrder.current[0] as object), creditAppliedVnd: 200_000 },
    ];
    mocks.ledgerFindFirst.mockResolvedValue({ status: "void" });
    mocks.ledgerAggregate.mockResolvedValue({ _sum: { amountVnd: 50_000 } });

    const result = await processPayosPayment(lateEvent());
    expect(result).toMatchObject({ outcome: "requires_review" });
    expect(mocks.reactivateEnrollments).not.toHaveBeenCalled();
  });
});

describe("grantReviewedPayment (nút /quan-tri)", () => {
  beforeEach(() => {
    mocks.paymentFindUnique.mockResolvedValue({
      id: "payment-1",
      status: "requires_review",
      reconciledAt: null,
      orderId: "order-1",
      receivedAt: new Date(),
    });
  });

  it("cấp quyền khi còn ghế — bỏ qua ràng buộc khoảng ân hạn", async () => {
    // Hạn đơn đã trôi rất lâu; admin override vẫn cho qua.
    mocks.lockedOrder.current = [
      {
        ...(mocks.lockedOrder.current[0] as object),
        expiresAt: new Date(Date.now() - 10 * HOUR),
      },
    ];

    const result = await grantReviewedPayment("payment-1");
    expect(result).toMatchObject({ granted: true, orderId: "order-1" });
    expect(mocks.reactivateEnrollments).toHaveBeenCalled();
    expect(mocks.paymentUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "requires_review" }),
        data: expect.objectContaining({ status: "succeeded" }),
      }),
    );
  });

  it("từ chối khi khóa đã hết chỗ", async () => {
    mocks.heldSeats.current = [{ courseId: "course-1", held: BigInt(20) }];

    const result = await grantReviewedPayment("payment-1");
    expect(result).toMatchObject({ granted: false });
    expect(mocks.reactivateEnrollments).not.toHaveBeenCalled();
  });

  it("từ chối một giao dịch đã rời hàng chờ", async () => {
    mocks.paymentFindUnique.mockResolvedValue({
      id: "payment-1",
      status: "succeeded",
      reconciledAt: new Date(),
      orderId: "order-1",
      receivedAt: new Date(),
    });

    const result = await grantReviewedPayment("payment-1");
    expect(result).toMatchObject({ granted: false });
  });
});
