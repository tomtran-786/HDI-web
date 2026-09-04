import { beforeEach, describe, expect, it, vi } from "vitest";
import { MIN_CHARGE_VND } from "@/lib/referral-pricing";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  queryRaw: vi.fn(),
  executeRaw: vi.fn(),
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
function lockRows(
  referredById: string | null,
  courseOverrides: Record<string, unknown> = {},
) {
  mocks.queryRaw
    .mockResolvedValueOnce([{ referredById }])
    .mockResolvedValueOnce([{ ...COURSE, ...courseOverrides }])
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
  mocks.executeRaw.mockResolvedValue(1);
  mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
    callback({
      $queryRaw: mocks.queryRaw,
      $executeRaw: mocks.executeRaw,
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

describe("gán người giới thiệu lười từ mã nhập ở checkout", () => {
  function attributeSql() {
    return (mocks.executeRaw.mock.calls[0][0] as unknown as string[])
      .join(" ")
      .replace(/\s+/g, " ");
  }

  it("ghi referred_by_id khi người này chưa có và chưa từng có đơn", async () => {
    lockRows(null); // referredById = null
    mocks.orderFindFirst.mockResolvedValue(null); // chưa có đơn paid

    const result = await createOrder("user-1", ["course-1"], {
      referrerId: "user-referrer",
    });

    expect(mocks.executeRaw).toHaveBeenCalledTimes(1);
    expect(attributeSql()).toContain("UPDATE users");
    expect(attributeSql()).toContain("referred_by_id");
    expect(attributeSql()).toContain("referred_by_id IS NULL");
    const params = mocks.executeRaw.mock.calls[0].slice(1);
    expect(params).toEqual(["user-referrer", "user-1"]);
    // Cột vừa được gán phải kích hoạt luôn khoản giảm 10% của đơn này.
    expect(result).toMatchObject({ ok: true, referralDiscountVnd: 100_000 });
  });

  it("bỏ qua mã khi người này đã có người giới thiệu", async () => {
    lockRows("user-cu"); // đã có referredById

    const result = await createOrder("user-1", ["course-1"], {
      referrerId: "user-referrer",
    });

    expect(mocks.executeRaw).not.toHaveBeenCalled();
    // Vẫn giảm 10%, nhưng theo người giới thiệu CŨ, không phải mã vừa nhập.
    expect(result).toMatchObject({ ok: true, referralDiscountVnd: 100_000 });
  });

  it("bỏ qua mã khi người này đã từng có đơn đã thanh toán (luật một lần)", async () => {
    lockRows(null);
    mocks.orderFindFirst.mockResolvedValue({ id: "order-cu" });

    await createOrder("user-1", ["course-1"], { referrerId: "user-referrer" });

    expect(mocks.executeRaw).not.toHaveBeenCalled();
    expect(orderData().referralDiscountVnd).toBe(0);
  });

  it("từ chối mã của chính mình ngay ở tầng createOrder", async () => {
    lockRows(null);

    const result = await createOrder("user-1", ["course-1"], {
      referrerId: "user-1",
    });

    expect(mocks.executeRaw).not.toHaveBeenCalled();
    expect(result).toMatchObject({ ok: true });
    expect(orderData().referralDiscountVnd).toBe(0);
  });

  it("không đụng tới users khi không có mã", async () => {
    lockRows(null);

    await createOrder("user-1", ["course-1"]);

    expect(mocks.executeRaw).not.toHaveBeenCalled();
  });
});

/**
 * Nửa phía server của bài parity ở tests/cart-modal-referral.test.tsx.
 *
 * Cùng khóa, cùng số người, cùng mã — hai con số phải bằng nhau, vì
 * `app/actions/checkout.ts` so `tongTienDuKien` với `amountVnd` bằng phép so
 * bằng tuyệt đối rồi HỦY đơn nếu lệch. Giá nhóm ở đây giảm 5%, ÍT hơn mức giới
 * thiệu 10%, nên `referralDiscountVnd` phải trả về phần chênh chứ không phải 0
 * (bậc nhóm mặc định giảm đúng 10% và sẽ nuốt trọn khoản giới thiệu).
 */
describe("đơn nhóm của người được giới thiệu", () => {
  const GROUP = {
    priceVnd: 1_000_000,
    groupEligible: true,
    groupPriceVnd: 950_000,
  };

  it("chỉ bù phần chênh, và ra đúng con số giỏ hàng đã hiện", async () => {
    lockRows(null, GROUP);

    const result = await createOrder("user-1", ["course-1"], {
      members: [
        { id: "user-2", email: "ban1@example.com" },
        { id: "user-3", email: "ban2@example.com" },
      ],
      referrerId: "user-referrer",
    });

    expect(result).toMatchObject({
      ok: true,
      groupSize: 3,
      // 3 × 950.000 = 2.850.000; mức cao nhất 10% × 3.000.000 = 300.000; nhóm đã
      // giảm 150.000 → chỉ bù thêm 150.000.
      referralDiscountVnd: 150_000,
      amountVnd: 2_700_000,
    });
  });

  it("không bù gì khi ưu đãi nhóm đã bằng hoặc hơn mức giới thiệu", async () => {
    // Không có `groupPriceVnd` ghi đè → bậc nhóm giảm đúng 10%, bằng mức giới
    // thiệu, nên hai ưu đãi không cộng dồn và phần bù là 0.
    lockRows(null, { groupEligible: true, groupPriceVnd: null });

    const result = await createOrder("user-1", ["course-1"], {
      members: [
        { id: "user-2", email: "ban1@example.com" },
        { id: "user-3", email: "ban2@example.com" },
      ],
      referrerId: "user-referrer",
    });

    expect(result).toMatchObject({
      ok: true,
      referralDiscountVnd: 0,
      amountVnd: 2_700_000,
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

    // Trần 30% học phí chạm trước ngưỡng MIN_CHARGE_VND ở đây, và đó chính là
    // điều chính sách 2026-09-01 muốn: 1.000.000đ học phí → tối đa 300.000đ
    // credits, nên đơn còn 700.000đ chứ không tụt xuống sát ngưỡng trả được.
    expect(result).toMatchObject({
      ok: true,
      creditAppliedVnd: 300_000,
      amountVnd: 700_000,
    });
    expect(700_000).toBeGreaterThan(MIN_CHARGE_VND);
  });

  /**
   * Trần 30% tính trên HỌC PHÍ, nên một đơn nhỏ vẫn phải chạm được ngưỡng
   * MIN_CHARGE_VND — đây là bài giữ cho luật "đơn không bao giờ về 0đ" còn hiệu
   * lực sau khi trần mới được thêm vào.
   */
  it("vẫn chừa ngưỡng tối thiểu khi trần 30% lớn hơn phần còn phải trả", async () => {
    lockRows(null, { priceVnd: 2_500 });
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
