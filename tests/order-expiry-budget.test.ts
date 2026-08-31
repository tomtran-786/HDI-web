import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  orderFindMany: vi.fn(),
  orderFindFirst: vi.fn(),
  transaction: vi.fn(),
  orderUpdateMany: vi.fn(),
  itemFindMany: vi.fn(),
  enrollmentUpdateMany: vi.fn(),
  ledgerUpdateMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: { findMany: mocks.orderFindMany, findFirst: mocks.orderFindFirst },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/lib/payos", () => ({
  payosClient: vi.fn(),
  isPayosNotFound: vi.fn(() => false),
}));

import { expireStaleOrders, reconcileStaleOrdersForPayer } from "@/lib/orders";

/** Đơn chưa từng có link PayOS: đóng được bằng một transaction thuần database. */
function unlinked(id: string) {
  return { id, code: 100000, provider: "payos", providerRef: null, checkoutUrl: null };
}

describe("ngân sách đóng đơn quá hạn", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.orderUpdateMany.mockResolvedValue({ count: 1 });
    mocks.itemFindMany.mockResolvedValue([{ enrollmentId: "enrollment-1" }]);
    mocks.enrollmentUpdateMany.mockResolvedValue({ count: 1 });
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        order: { updateMany: mocks.orderUpdateMany },
        orderItem: { findMany: mocks.itemFindMany },
        enrollment: { updateMany: mocks.enrollmentUpdateMany },
        referralLedger: { updateMany: mocks.ledgerUpdateMany },
      }),
    );
  });

  it("đóng hết danh sách khi còn ngân sách", async () => {
    const ids = ["o1", "o2", "o3"];
    mocks.orderFindMany.mockResolvedValue(ids.map((id) => ({ id })));
    mocks.orderFindFirst.mockImplementation(async ({ where }: { where: { id: string } }) =>
      unlinked(where.id),
    );

    await expect(expireStaleOrders(new Date(), 10_000)).resolves.toEqual({
      scanned: 3,
      expired: 3,
      released: 3,
    });
  });

  /**
   * Con số cứng 20 cũ là một hạn ngạch MỖI NGÀY, vì tài khoản Vercel Hobby chỉ
   * chạy được một lượt cron mỗi ngày: ngày nào có nhiều đơn bị bỏ dở hơn thế là
   * tồn đọng lớn dần mà không có gì báo. Trần theo thời gian thì tự co giãn —
   * và nó cũng là thứ giữ cho lượt cron không hết giờ giữa chừng, bỏ lại hai
   * bước Drive phía sau không bao giờ chạy.
   */
  it("dừng giữa chừng khi hết ngân sách thời gian", async () => {
    mocks.orderFindMany.mockResolvedValue(
      ["o1", "o2", "o3", "o4", "o5"].map((id) => ({ id })),
    );
    let now = 0;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    mocks.orderFindFirst.mockImplementation(async ({ where }: { where: { id: string } }) => {
      // Mỗi đơn "tốn" 400ms, nên ngân sách 1 giây chỉ đủ cho ba đơn đầu.
      now += 400;
      return unlinked(where.id);
    });

    const result = await expireStaleOrders(new Date(), 1_000);

    expect(result.scanned).toBe(3);
    expect(result.expired).toBe(3);
    vi.restoreAllMocks();
  });

  /**
   * Bản theo NGƯỜI, không theo khóa. Bỏ dở một lần checkout rồi quay lại với một
   * khóa khác là đơn cũ nằm ngoài tầm của bản theo khóa — và chừng nào nó chưa
   * đóng, `claimed` vẫn đọc nó là "đã dùng ưu đãi" còn dòng `reserved` trong sổ
   * vẫn trừ vào số dư credits.
   */
  it("lọc theo người trả tiền và không chạm database khi không có gì để dọn", async () => {
    mocks.orderFindMany.mockResolvedValue([]);

    await expect(reconcileStaleOrdersForPayer("user-1")).resolves.toEqual({
      scanned: 0,
      expired: 0,
      released: 0,
    });
    expect(mocks.orderFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-1", status: "pending" }),
      }),
    );
    expect(mocks.orderFindFirst).not.toHaveBeenCalled();
  });
});
