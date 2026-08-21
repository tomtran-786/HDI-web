import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  process: vi.fn(),
  fulfill: vi.fn(),
}));

vi.mock("@/lib/payos", () => ({
  PayosConfigurationError: class PayosConfigurationError extends Error {},
  verifyPayosWebhook: mocks.verify,
}));
vi.mock("@/lib/orders", () => ({ processPayosPayment: mocks.process }));
vi.mock("@/lib/fulfillment", () => ({ fulfillOrderDrive: mocks.fulfill }));

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
    mocks.verify.mockReset();
    mocks.process.mockReset();
    mocks.fulfill.mockReset();
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
    const response = await POST(request({ signed: true }));
    expect(response.status).toBe(200);
    expect(mocks.fulfill).toHaveBeenCalledWith("order-1");
  });

  it("returns 500 for database failures so PayOS can retry", async () => {
    mocks.verify.mockResolvedValue(verified);
    mocks.process.mockRejectedValue(new Error("database unavailable"));
    const response = await POST(request({ signed: true }));
    expect(response.status).toBe(500);
  });
});

