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

import { cancelOrder, syncPayosOrderStatus } from "@/lib/orders";

const pendingOrder = {
  id: "order-1",
  code: 100001,
  provider: "payos",
  providerRef: "link-1",
  checkoutUrl: "https://pay.payos.vn/web/link-1",
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
  /**
   * `createOrder` gán `provider: "payos"` NGAY lúc tạo đơn, trước khi
   * `ensurePayosCheckout` gọi sang PayOS. Chỉ đọc `provider` là mọi đường hủy —
   * kể cả rollback chốt giá chạy ngay giữa lúc học viên đang chờ — đều trả giá
   * cho một lượt gọi mạng chắc chắn trả về 404. Tệ hơn: PayOS chập lúc đó thành
   * `gateway_unavailable`, và một đơn chưa từng có link bị giữ nguyên cùng với
   * ghế, credits và suất giảm giá của chính người mua.
   */
  it("không hỏi PayOS về một đơn chưa từng có payment link", async () => {
    mocks.findFirst.mockResolvedValue({
      ...pendingOrder,
      providerRef: null,
      checkoutUrl: null,
    });

    await expect(cancelOrder("order-1", { userId: "user-1" })).resolves.toEqual({
      cancelled: true,
      released: 1,
    });
    expect(mocks.get).not.toHaveBeenCalled();
    expect(mocks.cancel).not.toHaveBeenCalled();
  });

  /** Một nửa bằng chứng cũng đủ: link có thể được ghi lại ở nhánh khôi phục
   * của `ensurePayosCheckout`, nơi chỉ `providerRef` được lưu. */
  it("vẫn hỏi PayOS khi chỉ có providerRef mà chưa có checkoutUrl", async () => {
    mocks.findFirst.mockResolvedValue({ ...pendingOrder, checkoutUrl: null });
    mocks.get.mockResolvedValue({ status: "EXPIRED" });

    await expect(cancelOrder("order-1")).resolves.toEqual({
      cancelled: true,
      released: 1,
    });
    expect(mocks.get).toHaveBeenCalledWith(100001);
  });
});

/**
 * `syncPayosOrderStatus` là đường đi ngược lại của `cancelOrder`: thay vì bảo
 * PayOS đóng link, nó hỏi PayOS xem link còn sống không. Nó tồn tại vì PayOS
 * KHÔNG gửi webhook nào cho việc hủy — mọi sự kiện nó gửi đều là sự kiện tiền —
 * nên một học viên bấm "Hủy" rồi đóng tab trước khi redirect kịp chạy sẽ để lại
 * một đơn giữ ghế cho tới lượt cron 03:00 hôm sau.
 */
describe("đồng bộ trạng thái đơn từ PayOS", () => {
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

  it("đóng đơn và trả ghế khi PayOS báo link đã hủy", async () => {
    mocks.get.mockResolvedValue({ status: "CANCELLED" });

    await expect(syncPayosOrderStatus("order-1")).resolves.toEqual({
      closed: true,
      as: "cancelled",
      released: 1,
    });
    expect(mocks.orderUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "cancelled" }),
      }),
    );
  });

  it("ghi link hết hạn là `expired`, không phải `cancelled`", async () => {
    mocks.get.mockResolvedValue({ status: "EXPIRED" });

    await expect(syncPayosOrderStatus("order-1")).resolves.toMatchObject({
      closed: true,
      as: "expired",
    });
  });

  it("KHÔNG BAO GIỜ gọi cancel lên PayOS", async () => {
    mocks.get.mockResolvedValue({ status: "CANCELLED" });

    await syncPayosOrderStatus("order-1");

    // Đây là lý do hàm này gọi được từ những chỗ mà một lệnh hủy sẽ là CSRF.
    expect(mocks.cancel).not.toHaveBeenCalled();
  });

  it("không đụng vào đơn khi PayOS vẫn đang giữ tiền hoặc link còn sống", async () => {
    for (const status of ["PAID", "PROCESSING", "UNDERPAID", "PENDING"]) {
      mocks.transaction.mockClear();
      mocks.get.mockResolvedValue({ status });

      await expect(syncPayosOrderStatus("order-1")).resolves.toEqual({
        closed: false,
      });
      expect(mocks.transaction).not.toHaveBeenCalled();
    }
  });

  it("một lỗi tra cứu không phải là bằng chứng, nên không đóng đơn nào", async () => {
    mocks.get.mockRejectedValue(new Error("gateway unavailable"));

    await expect(syncPayosOrderStatus("order-1")).resolves.toEqual({
      closed: false,
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("không tìm thấy link cũng không đóng đơn, khác hẳn cancelOrder", async () => {
    // Ở `cancelOrder` người dùng vừa yêu cầu đóng đơn nên 404 là đủ để trả chỗ.
    // Ở đây không ai yêu cầu gì cả.
    mocks.get.mockRejectedValue(new Error("not found"));
    mocks.isNotFound.mockReturnValue(true);

    await expect(syncPayosOrderStatus("order-1")).resolves.toEqual({
      closed: false,
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("không hỏi PayOS về một đơn chưa từng có payment link", async () => {
    mocks.findFirst.mockResolvedValue({
      ...pendingOrder,
      providerRef: null,
      checkoutUrl: null,
    });

    await expect(syncPayosOrderStatus("order-1")).resolves.toEqual({
      closed: false,
    });
    expect(mocks.get).not.toHaveBeenCalled();
  });
});
