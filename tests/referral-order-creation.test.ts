import { beforeEach, describe, expect, it, vi } from "vitest";
import { MIN_CHARGE_VND } from "@/lib/referral-pricing";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  queryRaw: vi.fn(),
  enrollmentFindMany: vi.fn(),
  enrollmentCreateMany: vi.fn(),
  orderCreate: vi.fn(),
  orderFindFirst: vi.fn(),
  orderFindMany: vi.fn(),
  ledgerAggregate: vi.fn(),
  ledgerCreate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    order: { findMany: mocks.orderFindMany },
  },
}));
vi.mock("@/lib/enrollment", () => ({ confirmEnrollments: vi.fn() }));
vi.mock("@/lib/payos", () => ({
  payosClient: vi.fn(),
  isPayosNotFound: vi.fn(() => true),
}));

import { createOrder } from "@/lib/orders";

const COURSE = {
  id: "course-1",
  slug: "nckh-ung-dung-ai-xuat-ban-quoc-te",
  priceVnd: 1_000_000,
  groupEligible: false,
  groupPriceVnd: null,
  capacity: 15,
  status: "open",
};

/** Ba truy vấn raw của `createOrder`, đúng thứ tự. */
function lockRows(referredById: string | null) {
  mocks.queryRaw
    .mockResolvedValueOnce([{ referredById }])
    .mockResolvedValueOnce([COURSE])
    .mockResolvedValueOnce([]);
}

function orderData() {
  return mocks.orderCreate.mock.calls[0][0].data as {
    amountVnd: number;
    referralDiscountVnd: number;
    creditAppliedVnd: number;
  };
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.orderFindMany.mockResolvedValue([]);
  mocks.orderFindFirst.mockResolvedValue(null);
  mocks.enrollmentFindMany.mockResolvedValue([]);
  mocks.ledgerAggregate.mockResolvedValue({ _sum: { amountVnd: null } });
  mocks.enrollmentCreateMany.mockImplementation(
    async ({ data }: { data: { userId: string; courseId: string }[] }) =>
      data.map((row, index) => ({ id: `enrollment-${index + 1}`, ...row })),
  );
  mocks.orderCreate.mockImplementation(
    async ({ data }: { data: { amountVnd: number } }) => ({
      id: "order-1",
      code: 100001,
      amountVnd: data.amountVnd,
    }),
  );
  mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
    callback({
      $queryRaw: mocks.queryRaw,
      enrollment: {
        findMany: mocks.enrollmentFindMany,
        createManyAndReturn: mocks.enrollmentCreateMany,
      },
      order: { create: mocks.orderCreate, findFirst: mocks.orderFindFirst },
      referralLedger: {
        aggregate: mocks.ledgerAggregate,
        create: mocks.ledgerCreate,
      },
    }),
  );
});

describe("giảm giá đơn đầu tiên của người được giới thiệu", () => {
  it("trừ 10% và ghi lại khoản đã trừ trên đơn", async () => {
    lockRows("user-referrer");

    const result = await createOrder("user-1", ["course-1"]);

    expect(result).toMatchObject({
      ok: true,
      amountVnd: 900_000,
      referralDiscountVnd: 100_000,
      creditAppliedVnd: 0,
    });
    expect(orderData()).toMatchObject({
      amountVnd: 900_000,
      referralDiscountVnd: 100_000,
    });
  });

  it("không giảm gì cho người không ai giới thiệu", async () => {
    lockRows(null);

    const result = await createOrder("user-1", ["course-1"]);

    expect(result).toMatchObject({ ok: true, amountVnd: 1_000_000 });
    expect(orderData().referralDiscountVnd).toBe(0);
    // Không cần tra "đã dùng chưa" khi vốn không có quyền dùng.
    expect(mocks.orderFindFirst).toHaveBeenCalledTimes(1);
  });

  /** "Một lần cho mỗi tài khoản" gắn với LẦN THANH TOÁN đầu tiên. */
  it("không giảm nữa khi người này đã từng có đơn đã thanh toán", async () => {
    lockRows("user-referrer");
    mocks.orderFindFirst.mockResolvedValue({ id: "order-cu" });

    const result = await createOrder("user-1", ["course-1"]);

    expect(result).toMatchObject({ ok: true, amountVnd: 1_000_000 });
    expect(orderData().referralDiscountVnd).toBe(0);
  });

  /**
   * Không chặn đơn `pending` đang giữ ưu đãi thì mở hai tab là được giảm hai
   * lần — chỉ cần trả một đơn và bỏ đơn kia.
   */
  it("hỏi đúng câu hỏi: đã thanh toán, hoặc đang có đơn chờ mang ưu đãi", async () => {
    lockRows("user-referrer");

    await createOrder("user-1", ["course-1"]);

    expect(mocks.orderFindFirst).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        OR: [
          { status: "paid" },
          { status: "pending", referralDiscountVnd: { gt: 0 } },
        ],
      },
      select: { id: true },
    });
  });
});

describe("tiêu credits khi đặt đơn", () => {
  it("không trừ gì khi học viên không bật", async () => {
    lockRows(null);
    mocks.ledgerAggregate.mockResolvedValue({ _sum: { amountVnd: 300_000 } });

    const result = await createOrder("user-1", ["course-1"]);

    expect(result).toMatchObject({ ok: true, amountVnd: 1_000_000 });
    expect(mocks.ledgerCreate).not.toHaveBeenCalled();
  });

  it("trừ credits và giữ chỗ ngay trong cùng transaction", async () => {
    lockRows(null);
    mocks.ledgerAggregate.mockResolvedValue({ _sum: { amountVnd: 300_000 } });

    const result = await createOrder("user-1", ["course-1"], { useCredit: true });

    expect(result).toMatchObject({ ok: true, amountVnd: 700_000, creditAppliedVnd: 300_000 });
    expect(mocks.ledgerCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        type: "redemption",
        status: "reserved",
        // Số ÂM: khoản giữ chỗ phải trừ vào số dư ngay lúc ghi, nếu không hai
        // lần checkout song song cùng tiêu được một khoản.
        amountVnd: -300_000,
        orderId: "order-1",
      }),
    });
  });

  it("cộng dồn với giảm giá giới thiệu, theo đúng thứ tự", async () => {
    lockRows("user-referrer");
    mocks.ledgerAggregate.mockResolvedValue({ _sum: { amountVnd: 200_000 } });

    const result = await createOrder("user-1", ["course-1"], { useCredit: true });

    // 1.000.000 − 100.000 (giới thiệu) − 200.000 (credits) = 700.000
    expect(result).toMatchObject({
      ok: true,
      amountVnd: 700_000,
      referralDiscountVnd: 100_000,
      creditAppliedVnd: 200_000,
    });
  });

  /**
   * Đơn 0đ không tạo được link PayOS, và chỉ webhook đã ký mới xác nhận được
   * thanh toán — khách sẽ kẹt ở một đơn không bao giờ mở khóa được.
   */
  it("luôn chừa lại phần phải trả dù số dư thừa sức phủ hết đơn", async () => {
    lockRows(null);
    mocks.ledgerAggregate.mockResolvedValue({ _sum: { amountVnd: 50_000_000 } });

    const result = await createOrder("user-1", ["course-1"], { useCredit: true });

    expect(result).toMatchObject({ ok: true, amountVnd: MIN_CHARGE_VND });
  });

  it("coi sổ rỗng là số dư 0 chứ không phải null", async () => {
    lockRows(null);
    mocks.ledgerAggregate.mockResolvedValue({ _sum: { amountVnd: null } });

    const result = await createOrder("user-1", ["course-1"], { useCredit: true });

    expect(result).toMatchObject({ ok: true, amountVnd: 1_000_000, creditAppliedVnd: 0 });
    expect(mocks.ledgerCreate).not.toHaveBeenCalled();
  });
});

describe("thứ tự khóa dòng", () => {
  /**
   * Khóa hàng user trước rồi mới tới courses, và MỌI checkout theo đúng thứ tự
   * đó. Hai giỏ hàng chồng nhau khóa ngược chiều nhau là định nghĩa của deadlock.
   */
  it("khóa hàng người trả tiền trước khi khóa courses", async () => {
    lockRows("user-referrer");

    await createOrder("user-1", ["course-1"]);

    const sql = mocks.queryRaw.mock.calls.map((call) =>
      (call[0] as unknown as string[]).join(" ").replace(/\s+/g, " "),
    );
    expect(sql[0]).toContain("FROM users");
    expect(sql[0]).toContain("FOR UPDATE");
    expect(sql[1]).toContain("FROM courses");
    expect(sql[1]).toContain("FOR UPDATE");
  });
});
/**
 * Credits và ưu đãi "đơn đầu tiên" thuộc về NGƯỜI, không thuộc về khóa học.
 *
 * `reconcileStaleOrdersForCourses` chỉ nhìn các khóa trong giỏ, nên bỏ dở một
 * lần checkout rồi quay lại với một khóa khác là đơn cũ không được đụng tới —
 * và chừng nào nó chưa đóng, `claimed` vẫn đọc nó là "đã dùng ưu đãi" còn dòng
 * `reserved` trong sổ vẫn trừ vào số dư. Trước đây chỉ cron hằng ngày mới gỡ,
 * tức học viên mất tiền thưởng của mình tới 24 giờ trên một tài khoản Hobby.
 */
describe("dọn đơn quá hạn trước khi định giá", () => {
  it("quét cả theo khóa trong giỏ lẫn theo chính người trả tiền", async () => {
    lockRows(null);

    await createOrder("user-1", ["course-1"]);

    const scopes = mocks.orderFindMany.mock.calls.map((call) => call[0].where);
    expect(scopes).toEqual([
      expect.objectContaining({
        status: "pending",
        items: { some: { courseId: { in: ["course-1"] } } },
      }),
      expect.objectContaining({ status: "pending", userId: "user-1" }),
    ]);
  });

  /** Cả hai lượt quét đều có trần, để một chồng đơn bị bỏ dở không làm treo
   * chính request đang cố dọn chúng: mỗi đơn có thể là hai lượt gọi PayOS. */
  it("giới hạn số đơn mỗi lượt quét", async () => {
    lockRows(null);

    await createOrder("user-1", ["course-1"]);

    for (const call of mocks.orderFindMany.mock.calls) {
      expect(call[0].take).toBeLessThanOrEqual(5);
    }
  });
});
