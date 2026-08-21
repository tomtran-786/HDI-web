import { describe, expect, it } from "vitest";
import { accessExpiry } from "@/lib/enrollment";

describe("course access expiry", () => {
  it("keeps null as unlimited access", () => {
    expect(accessExpiry(null, new Date())).toBeNull();
  });

  it("adds whole access days from the provider payment time", () => {
    const paidAt = new Date("2026-08-21T03:00:00.000Z");
    expect(accessExpiry(730, paidAt)?.toISOString()).toBe(
      "2028-08-20T03:00:00.000Z",
    );
  });
});

