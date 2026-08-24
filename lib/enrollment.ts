import { prisma } from "./prisma";
import type { Prisma } from "./generated/prisma/client";

/**
 * Either the pooled client or the client inside a `$transaction`.
 *
 * Order confirmation flips an order and its enrolments together, and "together"
 * has to mean one transaction — otherwise a process that dies halfway leaves an
 * order marked paid whose student still has no access.
 */
export type Db = Prisma.TransactionClient | typeof prisma;

/** The render-layer form of the single live-access predicate. */
export function hasLiveAccess(
  enrollment: {
    status: string;
    accessRevokedAt: Date | null;
    accessExpiresAt: Date | null;
  },
  now: Date,
) {
  return (
    enrollment.status === "paid" &&
    enrollment.accessRevokedAt === null &&
    (!enrollment.accessExpiresAt || enrollment.accessExpiresAt > now)
  );
}

/** The Prisma-query form of the same live-access predicate. */
export function liveAccessWhere(now: Date): Prisma.EnrollmentWhereInput {
  return {
    status: "paid",
    accessRevokedAt: null,
    OR: [{ accessExpiresAt: null }, { accessExpiresAt: { gt: now } }],
  };
}

/**
 * When recorded access ends, given the course's policy. NULL accessDays means
 * no expiry, which is not the same as "expires now".
 */
export function accessExpiry(accessDays: number | null, from: Date): Date | null {
  return accessDays
    ? new Date(from.getTime() + accessDays * 24 * 60 * 60 * 1000)
    : null;
}

/**
 * The one and only way an enrolment becomes `paid`.
 *
 * The payment webhook calls this, through confirmOrder(); nothing else does.
 * There is no admin button beside it on purpose — two ways to confirm a payment
 * is two code paths that drift, and the hand-operated one is always the one
 * that forgets to set `accessExpiresAt`.
 *
 * Idempotency is a conditional `updateMany`, not read-then-check: a provider
 * *will* redeliver the same event, and between a `findUnique` and a following
 * `update` there is a window where two deliveries both see `pending`. Filtering
 * on `status: "pending"` inside the write closes that window in the database.
 * `count === 0` therefore means "already handled", which is a success, not an
 * error — the caller should still answer the webhook 200.
 */
export async function confirmEnrollment(
  enrollmentId: string,
  db: Db = prisma,
  paidAt = new Date(),
) {
  const enrollment = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { course: { select: { accessDays: true } } },
  });
  if (!enrollment) return { confirmed: false, reason: "not_found" as const };

  const flipped = await db.enrollment.updateMany({
    where: { id: enrollmentId, status: "pending" },
    data: {
      status: "paid",
      paidAt,
      accessExpiresAt: accessExpiry(enrollment.course.accessDays, paidAt),
    },
  });

  return flipped.count === 0
    ? { confirmed: false, reason: "already_handled" as const }
    : { confirmed: true, reason: "ok" as const };
}
