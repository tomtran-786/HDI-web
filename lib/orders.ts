import { prisma } from "./prisma";
import { confirmEnrollment } from "./enrollment";
import { findCourse } from "./courses";
import { isPayosNotFound, payosClient } from "./payos";

/**
 * How long a pending order holds its seats.
 *
 * A pending enrolment occupies a place. Without a deadline an abandoned
 * checkout keeps that place forever and the course quietly looks
 * full — the failure nobody notices, because nothing errors. PayOS and the
 * local reservation share the same two-hour deadline.
 */
export const ORDER_TTL_HOURS = 2;

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
  expiresAt: Date;
};

export type OrderResult = OrderSuccess | OrderFailure;

type LockedCourse = {
  id: string;
  slug: string;
  priceVnd: number;
  capacity: number;
  status: string;
};

/**
 * Turn a basket of course ids into an order, or refuse and say why.
 *
 * Everything happens inside one transaction that begins by locking the course
 * rows with `SELECT … FOR UPDATE`, in id order. That lock is what makes the
 * seat check mean anything: without it, two people buying the last place both
 * count "1 of 2 taken" and both succeed. Locking in a fixed order is what keeps
 * two overlapping baskets from deadlocking against each other.
 *
 * Prices are read here, from the database, and never taken from the caller.
 */
export async function createOrder(
  userId: string,
  courseIds: string[],
): Promise<OrderResult> {
  if (courseIds.length === 0) {
    return { ok: false, reason: "empty", message: "Giỏ hàng đang trống." };
  }

  const sorted = [...new Set(courseIds)].sort();

  // Never hold row locks while calling PayOS. Reconcile candidates first; the
  // transaction below still performs the authoritative seat count.
  await reconcileStaleOrdersForCourses(sorted);

  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<LockedCourse[]>`
      SELECT id,
             slug,
             price_vnd   AS "priceVnd",
             capacity,
             status::text AS status
        FROM courses
       WHERE id = ANY(${sorted}::text[])
       ORDER BY id
         FOR UPDATE`;

    const byId = new Map(locked.map((c) => [c.id, c]));

    const [counts, mine] = await Promise.all([
      tx.$queryRaw<{ courseId: string; held: bigint }[]>`
        SELECT course_id AS "courseId", count(*)::bigint AS held
          FROM enrollments
         WHERE course_id = ANY(${sorted}::text[])
           AND (
             (
               status = 'paid'::enrollment_status
               AND access_revoked_at IS NULL
             )
             OR (
               status = 'pending'::enrollment_status
               AND (
                 NOT EXISTS (
                   SELECT 1 FROM order_items oi
                    WHERE oi.enrollment_id = enrollments.id
                 )
                 OR EXISTS (
                   SELECT 1
                     FROM order_items oi
                     JOIN orders o ON o.id = oi.order_id
                    WHERE oi.enrollment_id = enrollments.id
                      AND o.status = 'pending'::order_status
                      AND o.expires_at > now()
                 )
               )
             )
           )
         GROUP BY course_id`,
      tx.enrollment.findMany({
        where: {
          userId,
          courseId: { in: sorted },
          OR: [
            { status: "pending" },
            { status: "paid", accessRevokedAt: null },
          ],
        },
        select: { courseId: true },
      }),
    ]);

    const taken = new Map(counts.map((row) => [row.courseId, Number(row.held)]));
    const existing = new Set(mine.map((row) => row.courseId));

    // Validate the whole basket before writing anything. A half-placed order is
    // worse than a refused one, and refusing costs the student one message
    // instead of one message per line.
    for (const id of sorted) {
      const course = byId.get(id);
      if (!course || course.status !== "open" || !findCourse(course.slug)) {
        return {
          ok: false as const,
          reason: "not_open" as const,
          message: "Một khóa trong giỏ vừa đóng đăng ký. Vui lòng xem lại giỏ hàng.",
        };
      }

      if (existing.has(id)) {
        return {
          ok: false as const,
          reason: "already_enrolled" as const,
          message: `Bạn đang có quyền hoặc đơn chờ thanh toán cho khóa ${findCourse(course.slug)?.title ?? course.slug}.`,
        };
      }

      if ((taken.get(id) ?? 0) >= course.capacity) {
        return {
          ok: false as const,
          reason: "no_seats" as const,
          message: `Khóa ${findCourse(course.slug)?.title ?? course.slug} đã hết chỗ.`,
        };
      }
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ORDER_TTL_HOURS * 3600 * 1000);

    const items: {
      courseId: string;
      priceVnd: number;
      enrollmentId: string;
    }[] = [];

    for (const id of sorted) {
      const course = byId.get(id)!;
      // Every purchase gets a new access window. Old paid/cancelled rows remain
      // immutable history and are never reset in place.
      const enrollment = await tx.enrollment.create({
        data: { userId, courseId: id },
        select: { id: true },
      });

      items.push({
        courseId: id,
        priceVnd: course.priceVnd,
        enrollmentId: enrollment.id,
      });
    }

    const order = await tx.order.create({
      data: {
        userId,
        amountVnd: items.reduce((sum, i) => sum + i.priceVnd, 0),
        expiresAt,
        provider: "payos",
        items: { create: items },
      },
      select: { id: true, code: true, amountVnd: true },
    });

    return {
      ok: true as const,
      orderId: order.id,
      code: order.code,
      amountVnd: order.amountVnd,
      expiresAt,
    };
  });
}

export type PayosPaymentEvent = {
  orderCode: number;
  amount: number;
  currency: string;
  reference: string;
  paymentLinkId: string;
  transactionDateTime: string;
  code: string;
  payload: unknown;
};

type LockedOrder = {
  id: string;
  userId: string;
  status: "pending" | "paid" | "cancelled" | "expired" | "refunded";
  amountVnd: number;
  expiresAt: Date;
  providerRef: string | null;
};

export function payosTransactionTime(value: string) {
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? `${value.replace(" ", "T")}+07:00`
    : value;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function payosPaymentLinkMatches(
  storedPaymentLinkId: string | null,
  receivedPaymentLinkId: string,
) {
  return (
    receivedPaymentLinkId.length > 0 &&
    (!storedPaymentLinkId || storedPaymentLinkId === receivedPaymentLinkId)
  );
}

export function classifyPayosPayment(input: {
  providerCode: string;
  orderStatus: LockedOrder["status"];
  expectedAmount: number;
  receivedAmount: number;
  currency: string;
  transactionAt: Date | null;
  expiresAt: Date;
  paymentLinkMatches: boolean;
  consistentEnrollments: boolean;
}): "succeeded" | "failed" | "requires_review" {
  if (input.providerCode !== "00") return "failed";
  if (
    input.orderStatus !== "pending" ||
    input.receivedAmount !== input.expectedAmount ||
    input.currency !== "VND" ||
    !input.transactionAt ||
    input.transactionAt > input.expiresAt ||
    !input.paymentLinkMatches ||
    !input.consistentEnrollments
  ) {
    return "requires_review";
  }
  return "succeeded";
}

/**
 * Record a signed PayOS event and update the order aggregate in one short
 * transaction. A crash can therefore leave neither half committed.
 */
export async function processPayosPayment(input: PayosPaymentEvent) {
  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<LockedOrder[]>`
      SELECT id,
             user_id AS "userId",
             status::text AS status,
             amount_vnd AS "amountVnd",
             expires_at AS "expiresAt",
             provider_ref AS "providerRef"
        FROM orders
       WHERE code = ${input.orderCode}
       FOR UPDATE`;
    const order = locked[0];
    if (!order) {
      return { handled: true as const, outcome: "unknown_order" as const };
    }

    const providerRef =
      input.reference ||
      `${input.paymentLinkId}:${input.orderCode}:${input.amount}:${input.transactionDateTime}`;
    const existing = await tx.payment.findUnique({
      where: { provider_providerRef: { provider: "payos", providerRef } },
      select: { orderId: true, status: true },
    });
    if (existing && existing.orderId !== order.id) {
      return { handled: true as const, outcome: "reference_conflict" as const };
    }
    if (existing) {
      // A bank reference identifies one immutable provider event. Never let a
      // later payload with the same reference reinterpret a recorded mismatch
      // and grant access. Exact redeliveries and conflicting replays are both
      // acknowledged without another state transition; the stored event stays
      // append-only evidence for reconciliation.
      return {
        handled: true as const,
        outcome: existing.status === "requires_review"
          ? "requires_review" as const
          : "duplicate" as const,
        orderId: order.id,
      };
    }

    const paidAt = payosTransactionTime(input.transactionDateTime);
    const paymentLinkMatches = payosPaymentLinkMatches(
      order.providerRef,
      input.paymentLinkId,
    );
    const items = await tx.orderItem.findMany({
      where: { orderId: order.id },
      select: {
        enrollmentId: true,
        enrollment: { select: { userId: true, status: true } },
      },
      orderBy: { id: "asc" },
    });
    const consistentEnrollments =
      items.length > 0 &&
      items.every(
        (item) =>
          item.enrollmentId &&
          item.enrollment?.userId === order.userId &&
          item.enrollment.status === "pending",
      );

    const paymentStatus = classifyPayosPayment({
      providerCode: input.code,
      orderStatus: order.status,
      expectedAmount: order.amountVnd,
      receivedAmount: input.amount,
      currency: input.currency,
      transactionAt: paidAt,
      expiresAt: order.expiresAt,
      paymentLinkMatches,
      consistentEnrollments,
    });

    await tx.payment.create({
      data: {
        orderId: order.id,
        provider: "payos",
        providerRef,
        amountVnd: input.amount,
        status: paymentStatus,
        payload: input.payload as never,
      },
    });

    if (paymentStatus !== "succeeded") {
      return {
        handled: true as const,
        outcome: paymentStatus,
        orderId: order.id,
      };
    }

    const moment = paidAt!;
    const flipped = await tx.order.updateMany({
      where: { id: order.id, status: "pending" },
      data: {
        status: "paid",
        paidAt: moment,
        closedAt: moment,
        provider: "payos",
        providerRef: order.providerRef ?? input.paymentLinkId,
      },
    });
    if (flipped.count !== 1) {
      throw new Error(`Không thể xác nhận nguyên tử đơn ${order.id}.`);
    }

    let enrolled = 0;
    for (const item of items) {
      const result = await confirmEnrollment(item.enrollmentId!, tx, moment);
      if (result.confirmed) enrolled += 1;
    }
    return {
      handled: true as const,
      outcome: "succeeded" as const,
      orderId: order.id,
      enrolled,
      fulfill: true as const,
    };
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
async function cancelOrderLocally(
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
    if (flipped.count === 0) {
      return { cancelled: false as const, released: 0, reason: "not_pending" as const };
    }

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

const PAYOS_MONEY_STATES = new Set(["PAID", "PROCESSING", "UNDERPAID"]);

/** Cancel/expire remotely first; gateway uncertainty never releases a seat. */
export async function cancelOrder(
  orderId: string,
  options: { userId?: string; as?: "cancelled" | "expired" } = {},
) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      status: "pending",
      ...(options.userId ? { userId: options.userId } : {}),
    },
    select: { id: true, code: true, provider: true },
  });
  if (!order) {
    return { cancelled: false as const, released: 0, reason: "not_pending" as const };
  }

  if (order.provider === "payos") {
    try {
      let remote = await payosClient().paymentRequests.get(order.code);
      if (PAYOS_MONEY_STATES.has(remote.status)) {
        return {
          cancelled: false as const,
          released: 0,
          reason: "payment_in_progress" as const,
        };
      }
      if (remote.status === "PENDING") {
        remote = await payosClient().paymentRequests.cancel(
          order.code,
          options.as === "expired" ? "Hết thời gian giữ chỗ" : "Học viên hủy đơn",
        );
      }
      if (PAYOS_MONEY_STATES.has(remote.status) || remote.status === "PENDING") {
        return {
          cancelled: false as const,
          released: 0,
          reason: "payment_in_progress" as const,
        };
      }
    } catch (error) {
      if (!isPayosNotFound(error)) {
        console.error(`[payos] Không thể đóng link đơn #${order.code}:`, error);
        return {
          cancelled: false as const,
          released: 0,
          reason: "gateway_unavailable" as const,
        };
      }
      // Not found by the globally unique order code confirms there is no remote
      // link capable of accepting money.
    }
  }

  return cancelOrderLocally(order.id, options);
}

async function reconcileStaleOrdersForCourses(courseIds: string[], now = new Date()) {
  if (courseIds.length === 0) return;
  const candidates = await prisma.order.findMany({
    where: {
      status: "pending",
      expiresAt: { lte: now },
      items: { some: { courseId: { in: courseIds } } },
    },
    select: { id: true },
    orderBy: { expiresAt: "asc" },
  });
  for (const order of candidates) await cancelOrder(order.id, { as: "expired" });
}

/**
 * Release the seats held by orders nobody ever paid for.
 *
 * Called by the housekeeping cron (mỗi 6 giờ). Written as a loop over
 * cancelOrder rather than one
 * bulk update so that each order's seats are released in the same transaction
 * that closes it.
 */
export async function expireStaleOrders(now = new Date()) {
  const stale = await prisma.order.findMany({
    where: { status: "pending", expiresAt: { lt: now } },
    select: { id: true },
    orderBy: { expiresAt: "asc" },
    take: 20,
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
