import { prisma } from "./prisma";
import { confirmEnrollment } from "./enrollment";
import { SEAT_HELD } from "./cohorts";

/**
 * How long a pending order holds its seats.
 *
 * A pending enrolment occupies a place (see SEAT_HELD). Without a deadline an
 * abandoned checkout keeps that place forever and the intake quietly looks
 * full — the failure nobody notices, because nothing errors. Two days is long
 * enough for a bank transfer made on a Friday evening.
 */
export const ORDER_TTL_HOURS = 48;

export type OrderFailure = {
  ok: false;
  reason: "empty" | "not_open" | "already_enrolled" | "no_seats";
  message: string;
};

export type OrderSuccess = {
  ok: true;
  orderId: string;
  code: number;
  amountVnd: number;
};

export type OrderResult = OrderSuccess | OrderFailure;

type LockedCohort = {
  id: string;
  ky: string;
  courseSlug: string;
  priceVnd: number;
  capacity: number;
  status: string;
};

/**
 * Turn a basket of cohort ids into an order, or refuse and say why.
 *
 * Everything happens inside one transaction that begins by locking the cohort
 * rows with `SELECT … FOR UPDATE`, in id order. That lock is what makes the
 * seat check mean anything: without it, two people buying the last place both
 * count "1 of 2 taken" and both succeed. Locking in a fixed order is what keeps
 * two overlapping baskets from deadlocking against each other.
 *
 * Prices are read here, from the database, and never taken from the caller.
 */
export async function createOrder(
  userId: string,
  cohortIds: string[],
): Promise<OrderResult> {
  if (cohortIds.length === 0) {
    return { ok: false, reason: "empty", message: "Giỏ hàng đang trống." };
  }

  const sorted = [...new Set(cohortIds)].sort();

  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<LockedCohort[]>`
      SELECT id,
             ky,
             course_slug AS "courseSlug",
             price_vnd   AS "priceVnd",
             capacity,
             status::text AS status
        FROM cohorts
       WHERE id = ANY(${sorted}::text[])
       ORDER BY id
         FOR UPDATE`;

    const byId = new Map(locked.map((c) => [c.id, c]));

    const [counts, mine] = await Promise.all([
      tx.enrollment.groupBy({
        by: ["cohortId"],
        where: { cohortId: { in: sorted }, status: { in: SEAT_HELD } },
        _count: { _all: true },
      }),
      // Includes cancelled rows on purpose: the unique index on
      // (userId, cohortId) means a second attempt has to reuse that row, not
      // insert beside it.
      tx.enrollment.findMany({
        where: { userId, cohortId: { in: sorted } },
        select: { id: true, cohortId: true, status: true },
      }),
    ]);

    const taken = new Map(counts.map((c) => [c.cohortId, c._count._all]));
    const existing = new Map(mine.map((e) => [e.cohortId, e]));

    // Validate the whole basket before writing anything. A half-placed order is
    // worse than a refused one, and refusing costs the student one message
    // instead of one message per line.
    for (const id of sorted) {
      const cohort = byId.get(id);
      if (!cohort || cohort.status !== "open") {
        return {
          ok: false as const,
          reason: "not_open" as const,
          message:
            "Một kỳ học trong giỏ vừa đóng đăng ký. Vui lòng xem lại giỏ hàng.",
        };
      }

      const held = existing.get(id);
      if (held && SEAT_HELD.includes(held.status)) {
        return {
          ok: false as const,
          reason: "already_enrolled" as const,
          message: `Bạn đã ghi danh kỳ ${cohort.ky} rồi.`,
        };
      }

      if ((taken.get(id) ?? 0) >= cohort.capacity) {
        return {
          ok: false as const,
          reason: "no_seats" as const,
          message: `Kỳ ${cohort.ky} đã hết chỗ.`,
        };
      }
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ORDER_TTL_HOURS * 3600 * 1000);

    const items: {
      cohortId: string;
      priceVnd: number;
      enrollmentId: string;
    }[] = [];

    for (const id of sorted) {
      const cohort = byId.get(id)!;
      const held = existing.get(id);

      // Only cancelled or refunded rows reach here — anything live was refused
      // above. Reset the access fields too: a row that was revoked must not
      // come back still carrying its revocation.
      const enrollment = held
        ? await tx.enrollment.update({
            where: { id: held.id },
            data: {
              status: "pending",
              paidAt: null,
              accessExpiresAt: null,
              accessRevokedAt: null,
            },
            select: { id: true },
          })
        : await tx.enrollment.create({
            data: { userId, cohortId: id },
            select: { id: true },
          });

      items.push({
        cohortId: id,
        priceVnd: cohort.priceVnd,
        enrollmentId: enrollment.id,
      });
    }

    const order = await tx.order.create({
      data: {
        userId,
        amountVnd: items.reduce((sum, i) => sum + i.priceVnd, 0),
        expiresAt,
        items: { create: items },
      },
      select: { id: true, code: true, amountVnd: true },
    });

    return {
      ok: true as const,
      orderId: order.id,
      code: order.code,
      amountVnd: order.amountVnd,
    };
  });
}

/**
 * Record what a provider said it received, before acting on it.
 *
 * The `(provider, providerRef)` unique key is the idempotency lock: a
 * redelivered webhook collides here, and a collision is the signal to answer
 * 200 and do nothing rather than to confirm the same order twice.
 */
export async function recordPayment(input: {
  orderId: string;
  provider: string;
  providerRef: string;
  amountVnd: number;
  status?: "pending" | "succeeded" | "failed";
  payload?: unknown;
}) {
  try {
    const payment = await prisma.payment.create({
      data: {
        orderId: input.orderId,
        provider: input.provider,
        providerRef: input.providerRef,
        amountVnd: input.amountVnd,
        status: input.status ?? "succeeded",
        payload: (input.payload ?? undefined) as never,
      },
      select: { id: true },
    });
    return { recorded: true as const, paymentId: payment.id };
  } catch (error) {
    const code = (error as { code?: string }).code;
    // P2002 — unique violation, i.e. we have seen this exact event before.
    if (code === "P2002") return { recorded: false as const, reason: "duplicate" as const };
    throw error;
  }
}

/**
 * Mark an order paid and open up everything it bought.
 *
 * One transaction, because "order is paid" and "the student has access" must
 * not be able to disagree: a crash between the two would leave money taken and
 * a dashboard that still says waiting.
 *
 * Idempotent by the same conditional-update trick as confirmEnrollment: a
 * second delivery finds nothing in `pending` and reports `already_handled`,
 * which is a success.
 */
export async function confirmOrder(
  orderId: string,
  paid?: { provider: string; providerRef: string },
) {
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const flipped = await tx.order.updateMany({
      where: { id: orderId, status: "pending" },
      data: {
        status: "paid",
        paidAt: now,
        closedAt: now,
        ...(paid ? { provider: paid.provider, providerRef: paid.providerRef } : {}),
      },
    });
    if (flipped.count === 0) {
      return { confirmed: false as const, reason: "already_handled" as const };
    }

    const items = await tx.orderItem.findMany({
      where: { orderId },
      select: { enrollmentId: true },
    });

    let enrolled = 0;
    for (const item of items) {
      if (!item.enrollmentId) continue;
      const result = await confirmEnrollment(item.enrollmentId, tx);
      if (result.confirmed) enrolled += 1;
    }

    return { confirmed: true as const, reason: "ok" as const, enrolled };
  });
}

/**
 * Close a pending order and give its seats back.
 *
 * `expired` and `cancelled` are separate outcomes so a released seat can be
 * told apart from a deliberate refusal when reading the numbers later.
 *
 * Passing `userId` scopes the update, so the student-facing cancel button can
 * only ever touch that student's own order — a server action is its own
 * endpoint and the id in it comes from the browser.
 */
export async function cancelOrder(
  orderId: string,
  options: { userId?: string; as?: "cancelled" | "expired" } = {},
) {
  const { userId, as = "cancelled" } = options;

  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const flipped = await tx.order.updateMany({
      where: { id: orderId, status: "pending", ...(userId ? { userId } : {}) },
      data: { status: as, closedAt: now },
    });
    if (flipped.count === 0) return { cancelled: false as const, released: 0 };

    const items = await tx.orderItem.findMany({
      where: { orderId },
      select: { enrollmentId: true },
    });
    const enrollmentIds = items
      .map((i) => i.enrollmentId)
      .filter((id): id is string => id !== null);

    // `status: "pending"` in the filter is not decoration: an enrolment that
    // somehow became paid must never be revoked by a cancellation racing it.
    const released = await tx.enrollment.updateMany({
      where: { id: { in: enrollmentIds }, status: "pending" },
      data: { status: "cancelled", accessRevokedAt: now },
    });

    return { cancelled: true as const, released: released.count };
  });
}

/**
 * Release the seats held by orders nobody ever paid for.
 *
 * Called by the daily cron. Written as a loop over cancelOrder rather than one
 * bulk update so that each order's seats are released in the same transaction
 * that closes it.
 */
export async function expireStaleOrders(now = new Date()) {
  const stale = await prisma.order.findMany({
    where: { status: "pending", expiresAt: { lt: now } },
    select: { id: true },
  });

  let expired = 0;
  let released = 0;
  for (const order of stale) {
    const result = await cancelOrder(order.id, { as: "expired" });
    if (result.cancelled) {
      expired += 1;
      released += result.released;
    }
  }
  return { scanned: stale.length, expired, released };
}
