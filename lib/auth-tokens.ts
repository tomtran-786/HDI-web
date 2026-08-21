import { createHash, randomBytes } from "node:crypto";
import type { Prisma } from "./generated/prisma/client";
import { maskEmail } from "./auth-input";
import { prisma } from "./prisma";

export type AuthTokenPurpose = "verify" | "reset";
export type AuthDb = typeof prisma | Prisma.TransactionClient;

export const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export function hashAuthToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function authTokenIdentifier(purpose: AuthTokenPurpose, userId: string) {
  return `${purpose}:${userId}`;
}

export function parseAuthTokenIdentifier(
  identifier: string,
  purpose: AuthTokenPurpose,
) {
  const prefix = `${purpose}:`;
  return identifier.startsWith(prefix) ? identifier.slice(prefix.length) : null;
}

export async function createAuthToken(
  db: AuthDb,
  input: { userId: string; purpose: AuthTokenPurpose; ttlMs: number },
) {
  const identifier = authTokenIdentifier(input.purpose, input.userId);
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashAuthToken(token);
  const expires = new Date(Date.now() + input.ttlMs);

  await db.verificationToken.deleteMany({ where: { identifier } });
  await db.verificationToken.create({
    data: { identifier, token: tokenHash, expires },
  });
  return { token, expires };
}

export async function findAuthToken(
  db: AuthDb,
  purpose: AuthTokenPurpose,
  token: string,
) {
  const record = await db.verificationToken.findUnique({
    where: { token: hashAuthToken(token) },
  });
  if (!record || record.expires <= new Date()) return null;

  const userId = parseAuthTokenIdentifier(record.identifier, purpose);
  return userId ? { record, userId } : null;
}

/**
 * Consume exactly one bearer token while the caller's transaction is open.
 *
 * Checking the delete count is essential: two transactions can both read the
 * same row before either deletes it. Only the transaction whose conditional
 * delete removes that row may continue. Sibling tokens for the same purpose
 * are then invalidated so an older email cannot be replayed later.
 */
export async function consumeAuthToken(
  db: AuthDb,
  purpose: AuthTokenPurpose,
  token: string,
) {
  const found = await findAuthToken(db, purpose, token);
  if (!found) return null;

  const consumed = await db.verificationToken.deleteMany({
    where: {
      identifier: found.record.identifier,
      token: found.record.token,
    },
  });
  if (consumed.count !== 1) return null;

  await db.verificationToken.deleteMany({
    where: { identifier: found.record.identifier },
  });
  return { userId: found.userId };
}

/**
 * Read-only look-up behind the verification page, so the page can say whose
 * address it is about to verify — and can show "link expired" before the
 * student clicks a button that was always going to fail.
 *
 * Deliberately does NOT consume: this runs on a GET, and mail scanners follow
 * links in email. Spending the token here would verify accounts nobody asked
 * to verify, and burn the link before the real person ever opened it. Only the
 * POST action calls `consumeAuthToken`.
 */
export async function findVerifyRecipient(token: string) {
  if (!token) return null;
  const found = await findAuthToken(prisma, "verify", token);
  if (!found) return null;

  const user = await prisma.user.findUnique({
    where: { id: found.userId },
    select: { email: true, emailVerified: true },
  });
  // Already verified is "link no longer usable", not "ready to verify": the
  // action filters on `emailVerified: null` and would reject it anyway.
  if (!user || user.emailVerified) return null;
  return { maskedEmail: maskEmail(user.email) };
}

export async function pruneExpiredAuthTokens(now = new Date()) {
  const result = await prisma.verificationToken.deleteMany({
    where: { expires: { lt: now } },
  });
  return result.count;
}
