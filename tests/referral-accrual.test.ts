import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildCommissionRow } from "@/lib/referral-ledger";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  queryRaw: vi.fn(),
  paymentFindUnique: vi.fn(),
  paymentCreate: vi.fn(),
  itemFindMany: vi.fn(),
  orderUpdateMany: vi.fn(),
  userFindUnique: vi.fn(),
  ledgerUpdateMany: vi.fn(),
  ledgerCreateMany: vi.fn(),
  ledgerCount: vi.fn(),
  confirmEnrollments: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: mocks.transaction } }));
vi.mock("@/lib/enrollment", () => ({ confirmEnrollments: mocks.confirmEnrollments }));

import { processPayosPayment } from "@/lib/orders";

const NOW = new Date();

function lockedOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: "order-1",
    userId: "user-buyer",
    status: "pending",
    amountVnd: 900_000,
    creditAppliedVnd: 0,
    expiresAt: new Date(NOW.getTime() + 60_000),
    providerRef: "link-1",
    ...overrides,
  };
}

function payosEvent() {
  return {
    orderCode: 100001,
    amount: 900_000,
    currency: "VND",
    reference: "BANK-REF",
    paymentLinkId: "link-1",
    transactionDateTime: NOW.toISOString(),
    code: "00",
    payload: { signed: true },
  };
}

function commissionRows() {
  return mocks.ledgerCreateMany.mock.calls[0]?.[0].data as {
    userId: string;
    amountVnd: number;
    basisVnd: number;
    refereeUserId: string;
    ratePct: number;
  }[];
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.queryRaw.mockResolvedValue([lockedOrder()]);
  mocks.paymentFindUnique.mockResolvedValue(null);
  mocks.itemFindMany.mockResolvedValue([
    {
      enrollmentId: "enrollment-1",
      memberUserId: "user-buyer",
      enrollment: { userId: "user-buyer", status: "pending" },
    },
  ]);
  mocks.orderUpdateMany.mockResolvedValue({ count: 1 });
  mocks.confirmEnrollments.mockResolvedValue({ confirmed: 1 });
  mocks.userFindUnique.mockResolvedValue({ referredById: "user-referrer" });
  // Chưa lượt nào được thưởng trong cửa sổ sáu tháng, trừ khi bài tự đặt lại.
  mocks.ledgerCount.mockResolvedValue(0);
  mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
    callback({
      $queryRaw: mocks.queryRaw,
      payment: { findUnique: mocks.paymentFindUnique, create: mocks.paymentCreate },
      orderItem: { findMany: mocks.itemFindMany },
      order: { updateMany: mocks.orderUpdateMany },
      user: { findUnique: mocks.userFindUnique },
      referralLedger: {
        updateMany: mocks.ledgerUpdateMany,
        createMany: mocks.ledgerCreateMany,
        count: mocks.ledgerCount,
      },
    }),
  );
});

describe("cộng hoa hồng khi webhook xác nhận thanh toán", () => {
  it("ghi 10% trên tiền thực thu cho người giới thiệu của người trả tiền", async () => {
    await expect(processPayosPayment(payosEvent())).resolves.toMatchObject({
      outcome: "succeeded",
    });

    expect(commissionRows()).toEqual([
      expect.objectContaining({
        userId: "user-referrer",
        type: "commission",
        status: "posted",
        amountVnd: 90_000,
        basisVnd: 900_000,
        refereeUserId: "user-buyer",
        ratePct: 10,
        orderId: "order-1",
      }),
    ]);
  });

  /**
   * `skipDuplicates` sinh `ON CONFLICT DO NOTHING`, và nó tôn trọng cả hai
   * partial unique index. Không có cờ này thì webhook giao lại sẽ ném lỗi ràng
   * buộc, PayOS nhận 500 và gửi lại tiếp — một vòng lặp không thoát ra được.
   */
  it("luôn ghi ở chế độ bỏ qua trùng lặp", async () => {
    await processPayosPayment(payosEvent());

    expect(mocks.ledgerCreateMany).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true }),
    );
  });

  it("không ghi gì cho người không ai giới thiệu", async () => {
    mocks.userFindUnique.mockResolvedValue({ referredById: null });

    await processPayosPayment(payosEvent());

    expect(mocks.ledgerCreateMany).not.toHaveBeenCalled();
  });

  /**
   * Credits là khoản thưởng đã ghi nợ từ trước, không phải một khoản giảm giá.
   * Trừ nó khỏi căn cứ là tính hai lần trên cùng một đồng.
   */
  it("cộng lại phần credits đã trừ vào căn cứ tính hoa hồng", async () => {
    mocks.queryRaw.mockResolvedValue([
      lockedOrder({ amountVnd: 700_000, creditAppliedVnd: 200_000 }),
    ]);

    await processPayosPayment({ ...payosEvent(), amount: 700_000 });

    expect(commissionRows()[0]).toMatchObject({ basisVnd: 900_000, amountVnd: 90_000 });
  });

  it("đóng sổ khoản credits đã giữ chỗ, không void nó", async () => {
    await processPayosPayment(payosEvent());

    expect(mocks.ledgerUpdateMany).toHaveBeenCalledWith({
      where: { orderId: "order-1", type: "redemption", status: "reserved" },
      data: { status: "applied", settledAt: expect.any(Date) },
    });
  });

  it("không cộng gì khi thanh toán chưa được xác nhận", async () => {
    // Số tiền lệch → `requires_review`, không phải `succeeded`.
    await expect(
      processPayosPayment({ ...payosEvent(), amount: 800_000 }),
    ).resolves.toMatchObject({ outcome: "requires_review" });

    expect(mocks.ledgerCreateMany).not.toHaveBeenCalled();
    expect(mocks.ledgerUpdateMany).not.toHaveBeenCalled();
  });

  it("không cộng lại khi PayOS giao lại một sự kiện đã ghi", async () => {
    mocks.paymentFindUnique.mockResolvedValue({
      orderId: "order-1",
      status: "succeeded",
    });

    await expect(processPayosPayment(payosEvent())).resolves.toMatchObject({
      outcome: "duplicate",
    });
    expect(mocks.ledgerCreateMany).not.toHaveBeenCalled();
  });
});

describe("luật tính một dòng hoa hồng", () => {
  it("từ chối tự trả hoa hồng cho chính mình", () => {
    expect(
      buildCommissionRow({
        referrerId: "user-1",
        payerUserId: "user-1",
        orderId: "order-1",
        basisVnd: 900_000,
        now: NOW,
        rewardedInWindow: 0,
      }),
    ).toBeNull();
  });

  it("không sinh dòng 0đ", () => {
    expect(
      buildCommissionRow({
        referrerId: "user-referrer",
        payerUserId: "user-1",
        orderId: "order-1",
        basisVnd: 0,
        now: NOW,
        rewardedInWindow: 0,
      }),
    ).toBeNull();
  });

  it("ghi lại tỷ lệ và căn cứ tại thời điểm ghi sổ", () => {
    // Lịch sử phải đọc được bằng luật của chính nó, không phải luật hôm nay.
    expect(
      buildCommissionRow({
        referrerId: "user-referrer",
        payerUserId: "user-1",
        orderId: "order-1",
        basisVnd: 900_000,
        now: NOW,
        rewardedInWindow: 0,
      }),
    ).toMatchObject({ ratePct: 10, basisVnd: 900_000, amountVnd: 90_000 });
  });

  /**
   * Trần "tối đa 5 lượt thưởng trong 6 tháng" là giới hạn DUY NHẤT của chương
   * trình mà database không đỡ được — nó cần đếm nhiều hàng tại thời điểm ghi,
   * thứ không diễn đạt được bằng partial unique index. Nếu bài này bị xóa thì
   * không còn gì canh nó.
   */
  it("ngừng phát credits từ lượt thứ sáu trong cửa sổ sáu tháng", () => {
    expect(
      buildCommissionRow({
        referrerId: "user-referrer",
        payerUserId: "user-1",
        orderId: "order-1",
        basisVnd: 900_000,
        now: NOW,
        rewardedInWindow: 5,
      }),
    ).toBeNull();
  });

  it("vẫn phát ở lượt thứ năm", () => {
    expect(
      buildCommissionRow({
        referrerId: "user-referrer",
        payerUserId: "user-1",
        orderId: "order-1",
        basisVnd: 900_000,
        now: NOW,
        rewardedInWindow: 4,
      }),
    ).toMatchObject({ amountVnd: 90_000 });
  });

  /**
   * Credits nằm im tới khi hết thời hạn hoàn phí, rồi hết hạn sau sáu tháng.
   * Hai mốc này phải nằm NGAY trên dòng sổ: `creditBalanceVnd` đọc `availableAt`
   * để quyết định khoản nào đã vào số dư, và cron đọc `expiresAt` để xóa sổ.
   */
  it("đóng dấu mốc mở khóa và hạn dùng lên chính dòng sổ", () => {
    const row = buildCommissionRow({
      referrerId: "user-referrer",
      payerUserId: "user-1",
      orderId: "order-1",
      basisVnd: 900_000,
      now: new Date("2026-09-01T00:00:00.000Z"),
      rewardedInWindow: 0,
    })!;

    expect(row.availableAt.toISOString()).toBe("2026-09-08T00:00:00.000Z");
    expect(row.expiresAt.toISOString()).toBe("2027-03-01T00:00:00.000Z");
  });
});
