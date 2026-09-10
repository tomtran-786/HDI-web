import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tầm quét của bộ đối soát-kéo hằng đêm.
 *
 * Đây là lưới đỡ cuối cùng cho một khoản tiền về mà webhook không tới. Hai
 * thuộc tính của tầm quét đó là chuyện tiền bạc, không phải chuyện tối ưu:
 *
 * 1. Phải với tới đơn ĐÃ BỊ ĐÓNG. Lượt quét 03:00 đóng đơn quá hạn trước khi
 *    tiền về là chuyện thường; chỉ quét `pending` thì không lượt nào sau đó hỏi
 *    lại đơn đó nữa và tiền nằm lại `requires_review` vĩnh viễn.
 * 2. Phải có CHẶN DƯỚI. Đơn `pending` tự rời danh sách vì cron đóng chúng mỗi
 *    đêm, còn đơn `expired` thì ở lại mãi — không chặn dưới thì `take: 30` xếp
 *    theo `expiresAt` tăng dần sẽ hỏi PayOS về đúng 30 xác chết cũ nhất mỗi đêm
 *    và không bao giờ chạm tới đơn mới.
 */

const mocks = vi.hoisted(() => ({
  orderFindMany: vi.fn(),
  serviceOrderFindMany: vi.fn(),
  reclaimOrder: vi.fn(),
  reclaimService: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: { findMany: mocks.orderFindMany },
    serviceOrder: { findMany: mocks.serviceOrderFindMany },
  },
}));
vi.mock("@/lib/orders", () => ({
  ORDER_LATE_GRACE_MINUTES: 90,
  reclaimPaidPayosOrder: mocks.reclaimOrder,
}));
vi.mock("@/lib/service-orders", () => ({
  reclaimPaidPayosServiceOrder: mocks.reclaimService,
}));
vi.mock("@/lib/fulfillment", () => ({ runOrderFulfillment: vi.fn() }));
vi.mock("@/lib/payment-review", () => ({ notifyPaymentReview: vi.fn() }));

import {
  reconcilePaidPayosOrders,
  reconcilePaidPayosServiceOrders,
} from "@/lib/payos-reconcile";

const NOW = new Date("2026-09-09T20:00:00Z");
const GRACE_MS = 90 * 60_000;
const LOOKBACK_MS = 7 * 24 * 60 * 60_000;

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.orderFindMany.mockResolvedValue([]);
  mocks.serviceOrderFindMany.mockResolvedValue([]);
});

describe("tầm quét đối soát-kéo", () => {
  it("đơn khóa học: bỏ đơn đã có giao dịch thành công, giữ trần 30 đơn/lượt", async () => {
    await reconcilePaidPayosOrders(NOW);

    const { where, take } = mocks.orderFindMany.mock.calls[0][0];
    expect(where.payments).toEqual({ none: { status: "succeeded" } });
    expect(take).toBe(30);
  });

  /**
   * Hai nhóm ứng viên, hai tầm khác nhau — và sự khác nhau đó là toàn bộ vấn đề.
   *
   * `pending` chỉ có chặn trên: bình thường chúng tự drain vì cron đóng chúng
   * mỗi đêm, nhưng nếu cron ngừng chạy vài ngày thì một chặn dưới sẽ đẩy đúng
   * những đơn đó ra khỏi tầm với vĩnh viễn.
   *
   * `expired` bắt buộc có chặn dưới: chúng không bao giờ tự rời danh sách, nên
   * `take: 30` xếp theo `expiresAt` tăng dần sẽ quét lại đúng 30 xác chết cũ
   * nhất mỗi đêm và không chạm tới đơn mới.
   */
  it("đơn khóa học: `pending` không chặn dưới, `expired` có", async () => {
    await reconcilePaidPayosOrders(NOW);

    const { where } = mocks.orderFindMany.mock.calls[0][0];
    const branches = where.AND.find(
      (clause: { OR?: { status?: string }[] }) =>
        clause.OR?.some((item) => item.status === "pending"),
    ).OR;

    expect(branches).toEqual([
      {
        status: "pending",
        expiresAt: { lt: new Date(NOW.getTime() + GRACE_MS) },
      },
      {
        status: "expired",
        expiresAt: {
          gte: new Date(NOW.getTime() - LOOKBACK_MS),
          lt: new Date(NOW.getTime() + GRACE_MS),
        },
      },
    ]);
  });

  it("đơn khóa học: vẫn chỉ hỏi đơn từng có link PayOS", async () => {
    await reconcilePaidPayosOrders(NOW);

    const { where } = mocks.orderFindMany.mock.calls[0][0];
    expect(where.AND).toContainEqual({
      OR: [{ providerRef: { not: null } }, { checkoutUrl: { not: null } }],
    });
  });

  /**
   * Đơn dịch vụ CỐ Ý hẹp hơn: đường ghi của nó không có cổng cứu-tiền-về-muộn
   * và `updateMany` vẫn khóa cứng `status: "pending"` — nới ở đây chỉ đổi một
   * đơn bị bỏ qua thành một transaction ném lỗi.
   */
  it("đơn dịch vụ: vẫn chỉ `pending`, và cũng không có chặn dưới", async () => {
    await reconcilePaidPayosServiceOrders(NOW);

    const { where } = mocks.serviceOrderFindMany.mock.calls[0][0];
    expect(where.status).toBe("pending");
    expect(where.expiresAt).toEqual({
      lt: new Date(NOW.getTime() + GRACE_MS),
    });
  });
});
