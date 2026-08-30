import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  queryRaw: vi.fn(),
  enrollmentFindMany: vi.fn(),
  enrollmentCreate: vi.fn(),
  orderCreate: vi.fn(),
  orderFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    order: { findMany: mocks.orderFindMany },
  },
}));
vi.mock("@/lib/enrollment", () => ({ confirmEnrollment: vi.fn() }));
vi.mock("@/lib/payos", () => ({
  payosClient: vi.fn(),
  isPayosNotFound: vi.fn(() => true),
}));

import { createOrder } from "@/lib/orders";

const TIEULUAN = {
  id: "course-1",
  slug: "training-tieu-luan-nckh-kltn",
  priceVnd: 300000,
  groupEligible: true,
  groupPriceVnd: 250000,
  capacity: 15,
  status: "open",
};

const members = [
  { id: "user-2", email: "b@hdi.test" },
  { id: "user-3", email: "c@hdi.test" },
];

/** Số ghế đang bị chiếm, do truy vấn đếm raw thứ hai trả về. */
function seats(held: number) {
  mocks.queryRaw
    .mockResolvedValueOnce([TIEULUAN])
    .mockResolvedValueOnce(held > 0 ? [{ courseId: "course-1", held: BigInt(held) }] : []);
}

describe("tạo đơn nhóm", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.orderFindMany.mockResolvedValue([]);
    mocks.enrollmentFindMany.mockResolvedValue([]);
    let n = 0;
    mocks.enrollmentCreate.mockImplementation(async () => ({ id: `enrollment-${++n}` }));
    mocks.orderCreate.mockImplementation(async ({ data }: { data: { amountVnd: number } }) => ({
      id: "order-1",
      code: 100001,
      amountVnd: data.amountVnd,
    }));
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        $queryRaw: mocks.queryRaw,
        enrollment: { findMany: mocks.enrollmentFindMany, create: mocks.enrollmentCreate },
        order: { create: mocks.orderCreate },
      }),
    );
  });

  it("tính 250.000đ mỗi người và tạo một ghế cho từng thành viên", async () => {
    seats(0);

    const result = await createOrder("user-1", ["course-1"], { members });

    expect(result).toMatchObject({ ok: true, amountVnd: 750000, groupSize: 3 });
    expect(mocks.enrollmentCreate).toHaveBeenCalledTimes(3);
    for (const userId of ["user-1", "user-2", "user-3"]) {
      expect(mocks.enrollmentCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: { userId, courseId: "course-1" } }),
      );
    }

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
    expect(mocks.enrollmentCreate).toHaveBeenCalledTimes(1);
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
    expect(mocks.enrollmentCreate).not.toHaveBeenCalled();
  });

  /** Hai ghế cùng một người sẽ đâm vào partial unique index của enrollments. */
  it("khử trùng khi một thành viên trùng với chính người trả tiền", async () => {
    seats(0);
    const result = await createOrder("user-1", ["course-1"], {
      members: [{ id: "user-1", email: "a@hdi.test" }, ...members],
    });
    expect(result).toMatchObject({ ok: true, groupSize: 3, amountVnd: 750000 });
    expect(mocks.enrollmentCreate).toHaveBeenCalledTimes(3);
  });
});
