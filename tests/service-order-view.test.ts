import { describe, expect, it } from "vitest";
import { serviceOrderView } from "@/lib/service-orders";

const now = new Date("2026-08-24T00:00:00.000Z");
const past = new Date("2026-08-23T00:00:00.000Z");
const future = new Date("2026-08-25T00:00:00.000Z");

describe("trạng thái hiển thị của đơn dịch vụ", () => {
  it.each([
    ["paid", past, false, "paid"],
    ["pending", future, false, "open"],
    ["pending", future, true, "cancelled_checkout"],
    ["pending", past, false, "closed"],
    ["expired", past, false, "closed"],
    ["cancelled", future, false, "closed"],
    ["paid", past, true, "paid"],
  ] as const)(
    "%s / huy=%s → %s",
    (status, expiresAt, cancelledCheckout, expected) => {
      expect(
        serviceOrderView({ status, expiresAt }, now, cancelledCheckout),
      ).toBe(expected);
    },
  );
});
