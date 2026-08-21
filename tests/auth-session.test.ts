import { describe, expect, it } from "vitest";
import { jwtSurvivesSessionCutoff } from "@/lib/auth-session";

describe("JWT session invalidation", () => {
  const cutoff = new Date("2026-08-21T03:00:00.000Z");

  it("accepts sessions when no reset cutoff exists", () => {
    expect(
      jwtSurvivesSessionCutoff({ sessionsValidAfter: null }),
    ).toBe(true);
  });

  it("rejects tokens issued before a password reset", () => {
    expect(
      jwtSurvivesSessionCutoff({
        sessionsValidAfter: cutoff,
        issuedAtMs: cutoff.getTime() - 1,
      }),
    ).toBe(false);
    expect(
      jwtSurvivesSessionCutoff({
        sessionsValidAfter: cutoff,
        iat: cutoff.getTime() / 1000 - 1,
      }),
    ).toBe(false);
  });

  it("accepts tokens issued at or after the cutoff", () => {
    expect(
      jwtSurvivesSessionCutoff({
        sessionsValidAfter: cutoff,
        issuedAtMs: cutoff.getTime(),
      }),
    ).toBe(true);
  });

  it("fails closed when a cutoff exists but issue time is missing or invalid", () => {
    expect(
      jwtSurvivesSessionCutoff({ sessionsValidAfter: cutoff }),
    ).toBe(false);
    expect(
      jwtSurvivesSessionCutoff({
        sessionsValidAfter: cutoff,
        issuedAtMs: "not-a-number",
        iat: 0,
      }),
    ).toBe(false);
  });
});
