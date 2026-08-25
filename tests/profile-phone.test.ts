import { describe, expect, it } from "vitest";
import { isProfileComplete, phoneForTransfer } from "@/lib/profile";

describe("learner phone normalization", () => {
  it("builds a domestic transfer phone from both accepted formats", () => {
    expect(phoneForTransfer("0901 234 567")).toBe("0901234567");
    expect(phoneForTransfer("+84 901 234 567")).toBe("0901234567");
  });

  it("rejects invalid phones from completed profiles and transfer copy", () => {
    expect(isProfileComplete({ phone: "123", stage: "other" })).toBe(false);
    expect(phoneForTransfer("123")).toBeNull();
  });
});
