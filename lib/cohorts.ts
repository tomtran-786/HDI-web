import { prisma } from "./prisma";
import type { EnrollmentStatus } from "./generated/prisma/enums";

/**
 * The two enrolment states that occupy a seat.
 *
 * `pending` counts: a seat someone is in the middle of paying for is not
 * available to the next person, or the last place in a class gets sold twice.
 * Orders expire precisely so that a `pending` seat cannot be held forever —
 * see expireStaleOrders() in lib/orders.ts.
 */
export const SEAT_HELD: EnrollmentStatus[] = ["pending", "paid"];

/** How many places each intake has already given away. */
export async function seatsTaken(cohortIds: string[]) {
  const taken = new Map<string, number>();
  if (cohortIds.length === 0) return taken;

  const rows = await prisma.$queryRaw<{ cohortId: string; held: bigint }[]>`
    SELECT e.cohort_id AS "cohortId", count(*)::bigint AS held
      FROM enrollments e
     WHERE e.cohort_id = ANY(${cohortIds}::text[])
       AND (
         e.status = 'paid'::enrollment_status
         OR (
           e.status = 'pending'::enrollment_status
           AND (
             NOT EXISTS (
               SELECT 1 FROM order_items oi WHERE oi.enrollment_id = e.id
             )
             OR EXISTS (
               SELECT 1
                 FROM order_items oi
                 JOIN orders o ON o.id = oi.order_id
                WHERE oi.enrollment_id = e.id
                  AND o.status = 'pending'::order_status
                  AND o.expires_at > now()
             )
           )
         )
       )
     GROUP BY e.cohort_id`;
  for (const row of rows) taken.set(row.cohortId, Number(row.held));
  return taken;
}

/**
 * The intakes this student already holds a place in, and in what state. Used to
 * turn "Thêm vào giỏ" into "Đã ghi danh" rather than letting them pay twice for
 * a seat the unique index will refuse anyway.
 */
export async function heldByUser(userId: string, cohortIds: string[]) {
  const held = new Map<string, EnrollmentStatus>();
  if (cohortIds.length === 0) return held;

  const rows = await prisma.$queryRaw<
    { cohortId: string; status: EnrollmentStatus }[]
  >`
    SELECT e.cohort_id AS "cohortId", e.status::text AS status
      FROM enrollments e
     WHERE e.user_id = ${userId}
       AND e.cohort_id = ANY(${cohortIds}::text[])
       AND (
         e.status = 'paid'::enrollment_status
         OR (
           e.status = 'pending'::enrollment_status
           AND (
             NOT EXISTS (
               SELECT 1 FROM order_items oi WHERE oi.enrollment_id = e.id
             )
             OR EXISTS (
               SELECT 1
                 FROM order_items oi
                 JOIN orders o ON o.id = oi.order_id
                WHERE oi.enrollment_id = e.id
                  AND o.status = 'pending'::order_status
                  AND o.expires_at > now()
             )
           )
         )
       )`;
  for (const row of rows) held.set(row.cohortId, row.status);
  return held;
}

/**
 * The fields any shopping surface may read.
 *
 * `meetingUrl` and `driveFolderId` are absent by construction. Everything that
 * renders a cohort to someone who has not paid goes through this object, so the
 * two secrets cannot reach a page by someone reaching for `include: { cohort:
 * true }` in a hurry.
 */
export const COHORT_PUBLIC = {
  id: true,
  courseSlug: true,
  ky: true,
  khaiGiang: true,
  lichHoc: true,
  capacity: true,
  priceVnd: true,
  status: true,
} as const;

/** Intakes on sale, optionally narrowed to one course. */
export async function openCohorts(courseSlug?: string) {
  return prisma.cohort.findMany({
    // `open` only. `draft` is being prepared and `running` has already started;
    // neither is something a stranger may buy. This is also the sales switch:
    // with every intake left as `draft`, nothing anywhere can be added to a
    // cart, which is what keeps checkout dark until there is a real schedule.
    where: { status: "open", ...(courseSlug ? { courseSlug } : {}) },
    orderBy: { khaiGiang: "asc" },
    select: COHORT_PUBLIC,
  });
}
