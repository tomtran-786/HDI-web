import { describe, expect, it } from "vitest";
import {
  classifyPayosPayment,
  ORDER_LATE_GRACE_MINUTES,
  ORDER_TTL_HOURS,
  payosPaymentLinkMatches,
  payosTransactionTime,
} from "@/lib/orders";

const paidAt = new Date("2026-08-21T03:00:00.000Z");
const expiresAt = new Date("2026-08-21T04:00:00.000Z");

function classify(overrides: Partial<Parameters<typeof classifyPayosPayment>[0]> = {}) {
  return classifyPayosPayment({
    providerCode: "00",
    orderStatus: "pending",
    expectedAmount: 1_000_000,
    receivedAmount: 1_000_000,
    currency: "VND",
    transactionAt: paidAt,
    expiresAt,
    paymentLinkMatches: true,
    consistentEnrollments: true,
    ...overrides,
  });
}

describe("PayOS state validation", () => {
  it("holds a new order's seats for six hours, with a grace window past that", () => {
    // Sáu giờ, không phải hai: chuyển khoản liên ngân hàng ngoài giờ về chậm cả
    // tiếng, và tiền về sau mốc này bị đẩy vào đối soát thủ công thay vì cấp
    // quyền. `ORDER_LATE_GRACE_MINUTES` là lớp vá thứ hai — xem `reclaimLatePayment`.
    expect(ORDER_TTL_HOURS).toBe(6);
    expect(ORDER_LATE_GRACE_MINUTES).toBeGreaterThan(0);
  });

  it("accepts only an exact, on-time VND payment for a pending order", () => {
    expect(classify()).toBe("succeeded");
    expect(classify({ receivedAmount: 999_999 })).toBe("requires_review");
    expect(classify({ receivedAmount: 1_000_001 })).toBe("requires_review");
    expect(classify({ currency: "USD" })).toBe("requires_review");
    expect(classify({ transactionAt: new Date("2026-08-21T05:00:00Z") })).toBe(
      "requires_review",
    );
  });

  it("never reopens a closed order or inconsistent enrollment", () => {
    expect(classify({ orderStatus: "expired" })).toBe("requires_review");
    expect(classify({ orderStatus: "cancelled" })).toBe("requires_review");
    expect(classify({ consistentEnrollments: false })).toBe("requires_review");
    expect(classify({ paymentLinkMatches: false })).toBe("requires_review");
  });

  it("requires a non-empty matching PayOS payment-link id", () => {
    expect(payosPaymentLinkMatches("link-1", "")).toBe(false);
    expect(payosPaymentLinkMatches("link-1", "link-2")).toBe(false);
    expect(payosPaymentLinkMatches("link-1", "link-1")).toBe(true);
    expect(payosPaymentLinkMatches(null, "link-from-signed-webhook")).toBe(true);
  });

  it("records provider-declared failures as failed", () => {
    expect(classify({ providerCode: "01" })).toBe("failed");
  });

  it("parses PayOS Vietnam timestamps explicitly", () => {
    expect(payosTransactionTime("2026-08-21 10:00:00")?.toISOString()).toBe(
      "2026-08-21T03:00:00.000Z",
    );
    expect(payosTransactionTime("not-a-date")).toBeNull();
  });
});
