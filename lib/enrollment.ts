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

/**
 * The batched form of `confirmEnrollment`, for one order's worth of seats.
 *
 * Semantics are identical — the same conditional `updateMany` on `pending` is
 * what makes a redelivered webhook a no-op — but the number of round trips no
 * longer scales with the number of seats. That matters because this runs INSIDE
 * the webhook's transaction: a group of ten buying several courses is dozens of
 * order lines, and one query per line per seat pushed the transaction past
 * Prisma's timeout. When that happened the whole transaction rolled back, so
 * the `payments` row recording the money vanished with it and the transfer left
 * no trace anywhere — not even in the reconciliation queue.
 *
 * Enrolments are grouped by their course's `accessDays` because that is the
 * only per-row input to the write; every row in a group gets the same
 * `accessExpiresAt`, so each group is exactly one UPDATE.
 */
export async function confirmEnrollments(
  enrollmentIds: string[],
  db: Db = prisma,
  paidAt = new Date(),
) {
  if (enrollmentIds.length === 0) return { confirmed: 0 };

  const rows = await db.enrollment.findMany({
    where: { id: { in: enrollmentIds } },
    select: { id: true, course: { select: { accessDays: true } } },
  });

  // `null` accessDays means "no expiry", which is a distinct key from any
  // number — hence a Map keyed by the raw value rather than a coerced one.
  const byAccessDays = new Map<number | null, string[]>();
  for (const row of rows) {
    const key = row.course.accessDays;
    const group = byAccessDays.get(key) ?? [];
    group.push(row.id);
    byAccessDays.set(key, group);
  }

  let confirmed = 0;
  for (const [accessDays, ids] of byAccessDays) {
    const flipped = await db.enrollment.updateMany({
      where: { id: { in: ids }, status: "pending" },
      data: {
        status: "paid",
        paidAt,
        accessExpiresAt: accessExpiry(accessDays, paidAt),
      },
    });
    confirmed += flipped.count;
  }

  return { confirmed };
}

/**
 * Như `confirmEnrollments`, nhưng cũng vực dậy được ghi danh đã bị `cancelled`.
 *
 * Dùng đúng một chỗ: khi một khoản tiền về sau khi đơn đã bị đóng thành `expired`
 * và một lượt quét đã hủy ghi danh cùng nó, nhưng khóa vẫn còn ghế — xem
 * `reclaimLatePayment` trong `lib/orders.ts`. Nơi gọi PHẢI kiểm ghế trống và
 * ràng buộc `enrollments_user_id_course_id_active_key` trước; hàm này chỉ ghi.
 *
 * `accessRevokedAt` phải được xóa về `null`: lượt quét đã đóng dấu nó khi hủy,
 * và `hasLiveAccess` coi bất kỳ hàng nào còn `accessRevokedAt` là đã mất quyền.
 */
export async function reactivateEnrollments(
  enrollmentIds: string[],
  db: Db = prisma,
  paidAt = new Date(),
) {
  if (enrollmentIds.length === 0) return { confirmed: 0 };

  const rows = await db.enrollment.findMany({
    where: { id: { in: enrollmentIds } },
    select: { id: true, course: { select: { accessDays: true } } },
  });

  const byAccessDays = new Map<number | null, string[]>();
  for (const row of rows) {
    const key = row.course.accessDays;
    const group = byAccessDays.get(key) ?? [];
    group.push(row.id);
    byAccessDays.set(key, group);
  }

  let confirmed = 0;
  for (const [accessDays, ids] of byAccessDays) {
    const flipped = await db.enrollment.updateMany({
      where: { id: { in: ids }, status: { in: ["pending", "cancelled"] } },
      data: {
        status: "paid",
        paidAt,
        accessExpiresAt: accessExpiry(accessDays, paidAt),
        accessRevokedAt: null,
      },
    });
    confirmed += flipped.count;
  }

  return { confirmed };
}
