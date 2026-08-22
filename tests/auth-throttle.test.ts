import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ queryRaw: vi.fn(), deleteMany: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: { $queryRaw: mocks.queryRaw, authThrottle: { deleteMany: mocks.deleteMany } },
}));
vi.mock("@/lib/auth-secret", () => ({
  requiredAuthSecret: () => "test-secret-not-real",
}));

import {
  allowAuthEmail,
  allowLoginAttempt,
  allowResetConsume,
  allowUserAction,
  consumeAuthLimit,
  pruneAuthThrottles,
  requestIp,
} from "@/lib/auth-throttle";

/**
 * Stands in for the `auth_throttles` table's upsert-increment behaviour:
 * one counter per (action, key_hash, window_start), incremented on every
 * call and reset whenever `consumeAuthLimit` computes a new window bucket.
 */
function fakeThrottleTable() {
  const rows = new Map<string, number>();
  mocks.queryRaw.mockImplementation(
    async (_strings: TemplateStringsArray, ...values: unknown[]) => {
      const [action, keyHash, windowStart] = values as [string, string, Date];
      const bucket = `${action}|${keyHash}|${windowStart.getTime()}`;
      const count = (rows.get(bucket) ?? 0) + 1;
      rows.set(bucket, count);
      return [{ count }];
    },
  );
  return rows;
}

describe("auth throttle window math", () => {
  beforeEach(() => {
    mocks.queryRaw.mockReset();
    mocks.deleteMany.mockReset();
  });

  it("allows attempts up to the limit and denies the next one in the same window", async () => {
    fakeThrottleTable();
    const now = new Date("2026-01-01T00:00:00.000Z");
    const attempt = () =>
      consumeAuthLimit({ action: "t", key: "k", limit: 3, windowMs: 60_000, now });

    expect(await attempt()).toBe(true);
    expect(await attempt()).toBe(true);
    expect(await attempt()).toBe(true);
    expect(await attempt()).toBe(false);
  });

  it("resets the counter once the window rolls over", async () => {
    fakeThrottleTable();
    const windowMs = 60_000;
    const first = new Date("2026-01-01T00:00:00.000Z");
    const stillSameWindow = new Date(first.getTime() + windowMs - 1);
    const nextWindow = new Date(first.getTime() + windowMs);

    const attempt = (now: Date) =>
      consumeAuthLimit({ action: "t", key: "k", limit: 1, windowMs, now });

    expect(await attempt(first)).toBe(true);
    expect(await attempt(stillSameWindow)).toBe(false);
    expect(await attempt(nextWindow)).toBe(true);
  });

  it("keeps different keys on independent counters", async () => {
    fakeThrottleTable();
    const now = new Date("2026-01-01T00:00:00.000Z");
    const attempt = (key: string) =>
      consumeAuthLimit({ action: "t", key, limit: 1, windowMs: 60_000, now });

    expect(await attempt("alice@example.com")).toBe(true);
    expect(await attempt("bob@example.com")).toBe(true);
    expect(await attempt("alice@example.com")).toBe(false);
  });

  it("allowLoginAttempt shares one bucket per email+IP pair", async () => {
    fakeThrottleTable();
    for (let i = 0; i < 10; i++) {
      expect(await allowLoginAttempt("a@example.com", "1.2.3.4")).toBe(true);
    }
    expect(await allowLoginAttempt("a@example.com", "1.2.3.4")).toBe(false);
    // A different IP for the same email is a separate bucket.
    expect(await allowLoginAttempt("a@example.com", "9.9.9.9")).toBe(true);
  });

  it("allowAuthEmail requires both the email and the IP bucket to have room", async () => {
    fakeThrottleTable();
    // Exhaust only the email-scoped bucket (limit 3), leaving the IP bucket
    // (limit 10) with plenty of room — the combined check must still fail.
    for (let i = 0; i < 3; i++) {
      await consumeAuthLimit({
        action: "reset_email",
        key: "email:a@example.com",
        limit: 3,
        windowMs: 60 * 60 * 1000,
      });
    }
    expect(await allowAuthEmail("reset_email", "a@example.com", "1.2.3.4")).toBe(
      false,
    );
  });

  it("allowResetConsume is keyed by IP only, independent of any email", async () => {
    fakeThrottleTable();
    for (let i = 0; i < 10; i++) {
      expect(await allowResetConsume("5.5.5.5")).toBe(true);
    }
    expect(await allowResetConsume("5.5.5.5")).toBe(false);
    expect(await allowResetConsume("6.6.6.6")).toBe(true);
  });

  it("prunes only expired rows", async () => {
    mocks.deleteMany.mockResolvedValue({ count: 4 });
    const now = new Date("2026-01-01T00:00:00.000Z");
    await expect(pruneAuthThrottles(now)).resolves.toBe(4);
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: now } },
    });
  });

  it("allowLoginAttempt caps one email globally even when the IP keeps changing", async () => {
    fakeThrottleTable();
    // Rotating the source IP resets the email|ip bucket every time. Without the
    // email-only counter this loop would never be refused, which is exactly
    // what credential stuffing looks like from the server's side.
    for (let i = 0; i < 30; i++) {
      expect(await allowLoginAttempt("victim@example.com", `10.0.0.${i}`)).toBe(true);
    }
    expect(await allowLoginAttempt("victim@example.com", "10.0.1.1")).toBe(false);
    // Another account is untouched — the cap is per email, not global.
    expect(await allowLoginAttempt("someone@example.com", "10.0.1.1")).toBe(true);
  });

  it("allowLoginAttempt consumes both counters even when the first refuses", async () => {
    const rows = fakeThrottleTable();
    for (let i = 0; i < 11; i++) {
      await allowLoginAttempt("a@example.com", "1.2.3.4");
    }
    // A short-circuiting `&&` would leave the email bucket at 10, not 11.
    const emailBucket = [...rows.entries()].find(([key]) =>
      key.startsWith("password_login_email|"),
    );
    expect(emailBucket?.[1]).toBe(11);
  });

  it("allowUserAction gives each user their own bucket per action", async () => {
    fakeThrottleTable();
    for (let i = 0; i < 5; i++) {
      expect(await allowUserAction("drive_retry", "user-a", 5)).toBe(true);
    }
    expect(await allowUserAction("drive_retry", "user-a", 5)).toBe(false);
    // Same user, different action: independent budget.
    expect(await allowUserAction("checkout", "user-a", 5)).toBe(true);
    // Different user, same action: independent budget.
    expect(await allowUserAction("drive_retry", "user-b", 5)).toBe(true);
  });
});

describe("nguồn IP", () => {
  const ip = (headers: Record<string, string>) =>
    requestIp(new Request("https://hdi.test/", { headers }));

  it("ưu tiên x-vercel-forwarded-for hơn header client tự đặt được", () => {
    // Kẻ tấn công gửi x-forwarded-for giả để reset throttle theo IP; Vercel đặt
    // x-vercel-forwarded-for ở edge và đó mới là thứ được tin.
    expect(
      ip({
        "x-forwarded-for": "1.1.1.1",
        "x-real-ip": "2.2.2.2",
        "x-vercel-forwarded-for": "203.0.113.7",
      }),
    ).toBe("203.0.113.7");
  });

  it("vẫn rơi về x-forwarded-for khi chạy local, không có edge phía trước", () => {
    expect(ip({ "x-forwarded-for": "198.51.100.9, 10.0.0.1" })).toBe("198.51.100.9");
    expect(ip({ "x-real-ip": "198.51.100.9" })).toBe("198.51.100.9");
  });

  it("trả 'unknown' thay vì chuỗi rỗng khi không có header nào", () => {
    expect(ip({})).toBe("unknown");
    expect(ip({ "x-vercel-forwarded-for": "   " })).toBe("unknown");
  });
});
