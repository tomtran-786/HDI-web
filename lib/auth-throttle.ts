import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "./prisma";
import { requiredAuthSecret } from "./auth-secret";

type ThrottleRow = { count: number };

function throttleKey(value: string) {
  return createHmac("sha256", requiredAuthSecret())
    .update(value)
    .digest("hex");
}

export function requestIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function serverActionIp() {
  const values = await headers();
  return (
    values.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    values.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

/** Atomically consume one fixed-window attempt. */
export async function consumeAuthLimit(input: {
  action: string;
  key: string;
  limit: number;
  windowMs: number;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const startMs = Math.floor(now.getTime() / input.windowMs) * input.windowMs;
  const windowStart = new Date(startMs);
  const expiresAt = new Date(startMs + input.windowMs * 2);
  const keyHash = throttleKey(`${input.action}:${input.key}`);

  const rows = await prisma.$queryRaw<ThrottleRow[]>`
    INSERT INTO auth_throttles
      (action, key_hash, window_start, count, expires_at)
    VALUES
      (${input.action}, ${keyHash}, ${windowStart}, 1, ${expiresAt})
    ON CONFLICT (action, key_hash, window_start)
    DO UPDATE SET
      count = auth_throttles.count + 1,
      expires_at = EXCLUDED.expires_at
    RETURNING count`;

  return (rows[0]?.count ?? input.limit + 1) <= input.limit;
}

export async function allowLoginAttempt(email: string, ip: string) {
  return consumeAuthLimit({
    action: "password_login",
    key: `${email}|${ip}`,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
}

/**
 * Guards the token-*consuming* side of password reset, not just the request
 * side. `allowAuthEmail` throttles asking for a reset link; nothing throttled
 * actually spending one, even though that is the step where a guessed token
 * gets tried. Keyed by IP only — the reset form carries a token, not an
 * email, so there is no account identity to key on until the token resolves.
 */
export async function allowResetConsume(ip: string) {
  return consumeAuthLimit({
    action: "reset_consume",
    key: `ip:${ip}`,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
}

export async function allowAuthEmail(action: string, email: string, ip: string) {
  const [emailAllowed, ipAllowed] = await Promise.all([
    consumeAuthLimit({
      action,
      key: `email:${email}`,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    }),
    consumeAuthLimit({
      action,
      key: `ip:${ip}`,
      limit: 10,
      windowMs: 60 * 60 * 1000,
    }),
  ]);
  return emailAllowed && ipAllowed;
}

export async function pruneAuthThrottles(now = new Date()) {
  const result = await prisma.authThrottle.deleteMany({
    where: { expiresAt: { lt: now } },
  });
  return result.count;
}

