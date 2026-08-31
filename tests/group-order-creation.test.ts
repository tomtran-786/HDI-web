import { beforeEach, describe, expect, it, vi } from "vitest";

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

/** Hình dạng một hàng `courses` mà truy vấn FOR UPDATE của createOrder trả về. */
type LockedRow = {
  id: string;
  slug: string;
  priceVnd: number;
  groupEligible: boolean;
  groupPriceVnd: number | null;
  capacity: number;
  status: string;
};

const TIEULUAN: LockedRow = {
  id: "course-1",
  slug: "training-tieu-luan-nckh-kltn",
  priceVnd: 300000,
  groupEligible: true,
  groupPriceVnd: 250000,
  capacity: 15,
  status: "open",
};

/** Khóa KHÔNG tham gia ưu đãi nhóm, để kiểm chốt chặn đơn nhóm không hợp lệ. */
const AIQT: LockedRow = {
  id: "course-2",
  slug: "nckh-ung-dung-ai-xuat-ban-quoc-te",
  priceVnd: 3000000,
  groupEligible: false,
  groupPriceVnd: null,
  capacity: 15,
  status: "open",
};

const members = [
  { id: "user-2", email: "b@hdi.test" },
  { id: "user-3", email: "c@hdi.test" },
];

/**
 * Ba truy vấn raw của `createOrder`, đúng thứ tự: khóa hàng người trả tiền,
 * khóa các hàng courses, rồi đếm ghế đang bị chiếm.
 *
 * Thứ tự khóa user-trước-courses là cố ý và là thứ giữ cho hai giỏ chồng nhau
 * không deadlock, nên nó được cố định ở đây chứ không phải chuyện ngẫu nhiên.
 */
function seats(
  held: number,
  courses: LockedRow[] = [TIEULUAN],
  payer: { referredById: string | null } = { referredById: null },
) {
  mocks.queryRaw
    .mockResolvedValueOnce([payer])
    .mockResolvedValueOnce(courses)
    .mockResolvedValueOnce(held > 0 ? [{ courseId: "course-1", held: BigInt(held) }] : []);
}

describe("tạo đơn nhóm", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.orderFindMany.mockResolvedValue([]);
    mocks.orderFindFirst.mockResolvedValue(null);
    mocks.ledgerAggregate.mockResolvedValue({ _sum: { amountVnd: null } });
    mocks.enrollmentFindMany.mockResolvedValue([]);
    let n = 0;
    // `createManyAndReturn` trả về đúng thứ tự của `data`, và `createOrder` dựa
    // vào chính thứ tự đó để ánh xạ ngược ra người học của mỗi ghế.
    mocks.enrollmentCreateMany.mockImplementation(
      async ({ data }: { data: { userId: string; courseId: string }[] }) =>
        data.map((row) => ({ id: `enrollment-${++n}`, ...row })),
    );
    mocks.orderCreate.mockImplementation(async ({ data }: { data: { amountVnd: number } }) => ({
      id: "order-1",
      code: 100001,
      amountVnd: data.amountVnd,
    }));
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

  it("tính 250.000đ mỗi người và tạo một ghế cho từng thành viên", async () => {
    seats(0);

    const result = await createOrder("user-1", ["course-1"], { members });

    expect(result).toMatchObject({ ok: true, amountVnd: 750000, groupSize: 3 });
    // MỘT lệnh ghi cho cả nhóm, không phải một lệnh mỗi ghế: đó là thứ giữ cho
    // transaction đặt đơn không vượt hạn khi nhóm đông và giỏ nhiều khóa.
    expect(mocks.enrollmentCreateMany).toHaveBeenCalledTimes(1);
    expect(mocks.enrollmentCreateMany.mock.calls[0][0].data).toEqual(
      ["user-1", "user-2", "user-3"].map((userId) => ({
        userId,
        courseId: "course-1",
      })),
    );

    const items = mocks.orderCreate.mock.calls[0][0].data.items.create;
    expect(items).toHaveLength(3);
    expect(items.map((i: { memberUserId: string }) => i.memberUserId)).toEqual([
      "user-1",
      "user-2",
      "user-3",
    ]);
    // Giá snapshot trên MỌI dòng là giá nhóm, không phải giá lẻ.
    expect(items.every((i: { priceVnd: number }) => i.priceVnd === 250000)).toBe(true);
  });

  it("giữ nguyên giá lẻ khi nhóm chưa đủ ba người", async () => {
    seats(0);
    const result = await createOrder("user-1", ["course-1"], { members: members.slice(0, 1) });
    expect(result).toMatchObject({ ok: true, amountVnd: 600000, groupSize: 2 });
  });

  it("mua lẻ vẫn là nhóm một người với giá đầy đủ", async () => {
    seats(0);
    const result = await createOrder("user-1", ["course-1"]);
    expect(result).toMatchObject({ ok: true, amountVnd: 300000, groupSize: 1 });
    expect(mocks.enrollmentCreateMany.mock.calls[0][0].data).toHaveLength(1);
  });

  /** Nhóm chiếm nhiều ghế cùng lúc, nên "còn một chỗ" không đủ cho ba người. */
  it("từ chối khi số chỗ còn lại ít hơn số người trong nhóm", async () => {
    seats(13);
    const result = await createOrder("user-1", ["course-1"], { members });
    expect(result).toMatchObject({ ok: false, reason: "no_seats" });
    if (!result.ok) expect(result.message).toContain("2 chỗ");
    expect(mocks.orderCreate).not.toHaveBeenCalled();
  });

  it("nêu đích danh thành viên đã có quyền cho khóa trong giỏ", async () => {
    seats(0);
    mocks.enrollmentFindMany.mockResolvedValue([
      { courseId: "course-1", userId: "user-3" },
    ]);

    const result = await createOrder("user-1", ["course-1"], { members });

    expect(result).toMatchObject({ ok: false, reason: "already_enrolled" });
    if (!result.ok) expect(result.message).toContain("c@hdi.test");
    expect(mocks.enrollmentCreateMany).not.toHaveBeenCalled();
  });

  /** Hai ghế cùng một người sẽ đâm vào partial unique index của enrollments. */
  it("khử trùng khi một thành viên trùng với chính người trả tiền", async () => {
    seats(0);
    const result = await createOrder("user-1", ["course-1"], {
      members: [{ id: "user-1", email: "a@hdi.test" }, ...members],
    });
    expect(result).toMatchObject({ ok: true, groupSize: 3, amountVnd: 750000 });
    expect(mocks.enrollmentCreateMany.mock.calls[0][0].data).toHaveLength(3);
  });

  /**
   * Giỏ hàng chỉ hiện ô mời nhóm khi còn khóa hưởng ưu đãi, nhưng các input ẩn
   * mang danh sách thành viên nằm ngoài điều kiện đó — một lỗi ở client là đủ
   * để ba email đi kèm một giỏ không có ưu đãi nào, và đơn ra là ba ghế giá lẻ.
   * `tongTienDuKien` không bắt được vì hai bên tính ra cùng một con số.
   */
  it("từ chối đơn nhóm khi không khóa nào trong giỏ có ưu đãi nhóm", async () => {
    seats(0, [AIQT]);
    const result = await createOrder("user-1", ["course-2"], { members });
    expect(result).toMatchObject({ ok: false, reason: "group_not_eligible" });
    expect(mocks.enrollmentCreateMany).not.toHaveBeenCalled();
    expect(mocks.orderCreate).not.toHaveBeenCalled();
  });

  /** Mua lẻ khóa không có ưu đãi vẫn phải đi qua bình thường. */
  it("không đụng tới đơn một người của khóa không có ưu đãi nhóm", async () => {
    seats(0, [AIQT]);
    const result = await createOrder("user-1", ["course-2"]);
    expect(result).toMatchObject({ ok: true, groupSize: 1, amountVnd: 3000000 });
  });

  /** Giỏ trộn: một khóa có ưu đãi là đủ, mỗi khóa vẫn tính theo cấu hình riêng. */
  it("cho phép nhóm khi chỉ MỘT khóa trong giỏ có ưu đãi", async () => {
    seats(0, [TIEULUAN, AIQT]);
    const result = await createOrder("user-1", ["course-1", "course-2"], { members });
    // 250.000 × 3 (có ưu đãi) + 3.000.000 × 3 (giá lẻ).
    expect(result).toMatchObject({ ok: true, groupSize: 3, amountVnd: 9750000 });
  });
});
