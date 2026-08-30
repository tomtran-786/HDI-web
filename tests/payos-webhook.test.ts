import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  process: vi.fn(),
  processService: vi.fn(),
  fulfill: vi.fn(),
  notifyGroup: vi.fn(),
}));

vi.mock("@/lib/payos", () => ({
  PayosConfigurationError: class PayosConfigurationError extends Error {},
  verifyPayosWebhook: mocks.verify,
}));
vi.mock("@/lib/orders", () => ({ processPayosPayment: mocks.process }));
vi.mock("@/lib/service-orders", () => ({
  processServicePayment: mocks.processService,
}));
vi.mock("@/lib/fulfillment", () => ({
  fulfillOrderDrive: mocks.fulfill,
  notifyGroupMembers: mocks.notifyGroup,
}));

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
    mocks.fulfill.mockResolvedValue({ folders: 1, granted: 1 });
    mocks.notifyGroup.mockResolvedValue({ notified: 0 });
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
});

