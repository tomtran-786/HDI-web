import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  process: vi.fn(),
  processService: vi.fn(),
  fulfill: vi.fn(),
  sendReview: vi.fn(),
}));

vi.mock("@/lib/payos", () => ({
  PayosConfigurationError: class PayosConfigurationError extends Error {},
  verifyPayosWebhook: mocks.verify,
}));
vi.mock("@/lib/orders", () => ({ processPayosPayment: mocks.process }));
vi.mock("@/lib/service-orders", () => ({
  processServicePayment: mocks.processService,
}));
// Route gọi một helper duy nhất — `runOrderFulfillment` gói cả ba bước Drive/
// thư, và cùng helper đó cũng chạy trên đường webhook, đối soát-kéo và nút admin.
vi.mock("@/lib/fulfillment", () => ({ runOrderFulfillment: mocks.fulfill }));
vi.mock("@/lib/email", () => ({ sendPaymentReviewEmail: mocks.sendReview }));

import { POST } from "@/app/api/webhooks/payos/route";

function request(body: unknown) {
  return new Request("https://hdi.test/api/webhooks/payos", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const verified = {
  orderCode: 100001,
  amount: 1_000_000,
  currency: "VND",
  reference: "BANK-REF",
  paymentLinkId: "link-id",
  transactionDateTime: "2026-08-21 10:00:00",
  code: "00",
};

describe("PayOS webhook route", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    process.env.ADMIN_EMAILS = "admin@hdi.test, ops@hdi.test";
    mocks.sendReview.mockResolvedValue({ sent: true });
  });

  it("rejects an invalid signature before touching payment state", async () => {
    mocks.verify.mockRejectedValue(new Error("bad signature"));
    const response = await POST(request({ forged: true }));
    expect(response.status).toBe(400);
    expect(mocks.process).not.toHaveBeenCalled();
  });

  it("acknowledges business review outcomes without granting access", async () => {
    mocks.verify.mockResolvedValue(verified);
    mocks.process.mockResolvedValue({
      handled: true,
      outcome: "requires_review",
      orderId: "order-1",
    });
    const response = await POST(request({ signed: true }));
    expect(response.status).toBe(200);
    expect(mocks.fulfill).not.toHaveBeenCalled();
  });

  it("runs Drive fulfillment only after a committed payment outcome", async () => {
    mocks.verify.mockResolvedValue(verified);
    mocks.process.mockResolvedValue({
      handled: true,
      outcome: "succeeded",
      orderId: "order-1",
      fulfill: true,
    });
    mocks.fulfill.mockResolvedValue(undefined);
    const response = await POST(request({ signed: true }));
    expect(response.status).toBe(200);
    expect(mocks.fulfill).toHaveBeenCalledWith("order-1");
  });

  /**
   * Giao hàng nằm sau transaction thanh toán, nên một lambda hết giờ để lại đơn
   * `paid` chưa cấp quyền và chưa gửi thư. Lượt giao lại của PayOS là cơ hội duy
   * nhất còn lại để chạy nốt.
   */
  it("chạy lại giao hàng cho một lượt gửi lại của giao dịch đã thu tiền", async () => {
    mocks.verify.mockResolvedValue(verified);
    mocks.process.mockResolvedValue({
      handled: true,
      outcome: "duplicate",
      orderId: "order-1",
      fulfill: true,
    });
    mocks.fulfill.mockResolvedValue(undefined);

    const response = await POST(request({ signed: true }));
    expect(response.status).toBe(200);
    expect(mocks.fulfill).toHaveBeenCalledWith("order-1");
  });

  it("falls through to the service ledger when the code is not a course order", async () => {
    // Đơn dịch vụ và đơn khóa học đi chung một cổng PayOS. Rẽ nhánh phải dựa
    // vào KẾT QUẢ TRA CỨU, không vào dải số — dải số là quy ước của migration.
    mocks.verify.mockResolvedValue({ ...verified, orderCode: 900_000_001 });
    mocks.process.mockResolvedValue({ handled: true, outcome: "unknown_order" });
    mocks.processService.mockResolvedValue({
      handled: true,
      outcome: "succeeded",
      serviceOrderId: "svc-1",
    });

    const response = await POST(request({ signed: true }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      scope: "service",
      outcome: "succeeded",
    });
    expect(mocks.processService).toHaveBeenCalledWith(
      expect.objectContaining({ orderCode: 900_000_001 }),
    );
    // Cấp quyền Drive là việc của đơn khóa học; đơn dịch vụ không có gì để cấp.
    expect(mocks.fulfill).not.toHaveBeenCalled();
  });

  it("never reaches the service ledger for a code that is a course order", async () => {
    mocks.verify.mockResolvedValue(verified);
    mocks.process.mockResolvedValue({
      handled: true,
      outcome: "duplicate",
      orderId: "order-1",
    });
    const response = await POST(request({ signed: true }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ scope: "order" });
    expect(mocks.processService).not.toHaveBeenCalled();
  });

  it("acknowledges a code that belongs to neither ledger instead of retrying forever", async () => {
    mocks.verify.mockResolvedValue(verified);
    mocks.process.mockResolvedValue({ handled: true, outcome: "unknown_order" });
    mocks.processService.mockResolvedValue({
      handled: true,
      outcome: "unknown_order",
    });
    const response = await POST(request({ signed: true }));
    // 2xx: PayOS gửi lại mãi một mã không thuộc về ai chỉ tạo ra tiếng ồn.
    expect(response.status).toBe(200);
  });

  it("returns 500 for database failures so PayOS can retry", async () => {
    mocks.verify.mockResolvedValue(verified);
    mocks.process.mockRejectedValue(new Error("database unavailable"));
    const response = await POST(request({ signed: true }));
    expect(response.status).toBe(500);
  });
  /**
   * Một khoản tiền cần đối soát PHẢI tới tay một con người.
   *
   * Trước đây chỗ này chỉ có `console.error`, và trên Vercel Hobby log runtime
   * giữ khoảng một giờ — nên trên thực tế nó im lặng: tiền đã vào tài khoản,
   * học viên không có quyền truy cập, và bề mặt duy nhất còn lại là một hàng
   * chờ trong /quan-tri mà không có gì thúc ai đó mở ra.
   */
  it("báo cho mọi địa chỉ trong ADMIN_EMAILS khi có tiền cần đối soát", async () => {
    mocks.verify.mockResolvedValue(verified);
    mocks.process.mockResolvedValue({
      handled: true,
      outcome: "requires_review",
      orderId: "order-1",
      review: {
        label: "Đơn #100001",
        reason: "Số tiền không khớp",
        expectedVnd: 1_000_000,
        receivedVnd: 900_000,
        providerRef: "BANK-REF",
      },
    });

    const response = await POST(request({ signed: true }));

    expect(response.status).toBe(200);
    expect(mocks.sendReview).toHaveBeenCalledTimes(2);
    expect(mocks.sendReview.mock.calls.map((call) => call[0].to)).toEqual([
      "admin@hdi.test",
      "ops@hdi.test",
    ]);
    expect(mocks.sendReview).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "Số tiền không khớp", receivedVnd: 900_000 }),
    );
  });

  /**
   * PayOS giao lại một sự kiện đã ghi xong là chuyện bình thường. Lượt giao lại
   * đi vào nhánh `existing` và không mang `review`, nên một sự kiện sinh đúng
   * một lá thư — một lá thư cho mỗi lần retry là cách nhanh nhất dạy người nhận
   * bỏ qua loại thư này.
   */
  it("không báo lại khi PayOS giao lại một sự kiện đã ghi", async () => {
    mocks.verify.mockResolvedValue(verified);
    mocks.process.mockResolvedValue({
      handled: true,
      outcome: "requires_review",
      orderId: "order-1",
    });

    const response = await POST(request({ signed: true }));

    expect(response.status).toBe(200);
    expect(mocks.sendReview).not.toHaveBeenCalled();
  });

  /**
   * `sendEmail` báo Resend từ chối bằng `{ sent: false }` chứ không ném, nên
   * `catch` không bao giờ chạy cho trường hợp đó. Dù thế nào, gửi thư hỏng cũng
   * không được biến thành một phản hồi khác 2xx: PayOS coi mọi thứ khác 2xx là
   * lý do giao lại, và giao lại một sự kiện đã ghi xong chỉ tạo thêm việc.
   */
  it("vẫn trả 200 khi thư báo động bị từ chối hoặc ném lỗi", async () => {
    mocks.verify.mockResolvedValue(verified);
    mocks.process.mockResolvedValue({
      handled: true,
      outcome: "reference_conflict",
      review: {
        label: "Đơn #100001",
        reason: "Mã giao dịch đã thuộc về một đơn khác",
        expectedVnd: 1_000_000,
        receivedVnd: 1_000_000,
        providerRef: "BANK-REF",
      },
    });
    mocks.sendReview
      .mockResolvedValueOnce({ sent: false, error: "domain_not_verified" })
      .mockRejectedValueOnce(new Error("APP_URL chưa được thiết lập"));

    const response = await POST(request({ signed: true }));

    expect(response.status).toBe(200);
    // Hộp thư thứ hai vẫn được thử dù hộp thư đầu hỏng.
    expect(mocks.sendReview).toHaveBeenCalledTimes(2);
  });

  it("báo động cả cho đơn dịch vụ, không riêng đơn khóa học", async () => {
    mocks.verify.mockResolvedValue({ ...verified, orderCode: 900000001 });
    mocks.process.mockResolvedValue({ handled: true, outcome: "unknown_order" });
    mocks.processService.mockResolvedValue({
      handled: true,
      outcome: "requires_review",
      serviceOrderId: "svc-1",
      review: {
        label: "Đơn dịch vụ #900000001",
        reason: "Giao dịch xảy ra sau hạn đơn",
        expectedVnd: 70_000,
        receivedVnd: 70_000,
        providerRef: "BANK-REF",
      },
    });

    const response = await POST(request({ signed: true }));

    expect(response.status).toBe(200);
    expect(mocks.sendReview).toHaveBeenCalledTimes(2);
    expect(mocks.sendReview).toHaveBeenCalledWith(
      expect.objectContaining({ label: "Đơn dịch vụ #900000001" }),
    );
  });
});
