import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { findCourse } from "./courses";
import { COHORT_PUBLIC, heldByUser, seatsTaken } from "./cohorts";
import {
  CART_COOKIE,
  CART_MAX_AGE,
  parseCart,
  serializeCart,
} from "./cart-cookie";

/** Why a line is in the cart but cannot be bought right now. */
export type CartBlock = "no_seats" | "already_enrolled";

export type CartLine = {
  cohortId: string;
  courseSlug: string;
  courseTitle: string;
  ky: string;
  khaiGiang: Date;
  lichHoc: string;
  priceVnd: number;
  seatsLeft: number;
  blocked: CartBlock | null;
};

export type CartView = {
  lines: CartLine[];
  /** Sum of the lines that can actually be ordered. */
  totalVnd: number;
  buyable: CartLine[];
  /**
   * Ids the cookie still names that no longer resolve to an intake on sale —
   * the cohort closed, was renamed, or the cookie was edited by hand.
   */
  droppedIds: string[];
};

export async function readCartIds() {
  const jar = await cookies();
  return parseCart(jar.get(CART_COOKIE)?.value);
}

/** Server-side write, for the paths that must leave the cart empty. */
export async function writeCartIds(ids: string[]) {
  const jar = await cookies();
  if (ids.length === 0) {
    jar.delete(CART_COOKIE);
    return;
  }
  jar.set(CART_COOKIE, serializeCart(ids), {
    path: "/",
    maxAge: CART_MAX_AGE,
    sameSite: "lax",
    // Deliberately readable by JavaScript: the header badge updates from it and
    // there is nothing secret in a list of cohort ids.
    httpOnly: false,
  });
}

/**
 * Turn the cookie's ids into something renderable, and price it.
 *
 * Every figure here comes from the database. The cookie contributes ids and
 * nothing else, so a hand-edited cart can change *what* is in the basket but
 * never what it costs — and an id that names a closed or deleted intake drops
 * out rather than becoming an error.
 */
export async function loadCart(
  ids: string[],
  userId?: string | null,
): Promise<CartView> {
  if (ids.length === 0) {
    return { lines: [], totalVnd: 0, buyable: [], droppedIds: [] };
  }

  const cohorts = await prisma.cohort.findMany({
    where: { id: { in: ids }, status: "open" },
    select: COHORT_PUBLIC,
  });

  const [taken, held] = await Promise.all([
    seatsTaken(cohorts.map((c) => c.id)),
    userId
      ? heldByUser(
          userId,
          cohorts.map((c) => c.id),
        )
      : Promise.resolve(new Map<string, string>()),
  ]);

  const byId = new Map(cohorts.map((c) => [c.id, c]));
  const lines: CartLine[] = [];
  const droppedIds: string[] = [];

  // Iterate the cookie, not the query result, so the cart keeps the order the
  // student added things in.
  for (const id of ids) {
    const cohort = byId.get(id);
    if (!cohort) {
      droppedIds.push(id);
      continue;
    }
    const course = findCourse(cohort.courseSlug);
    if (!course) {
      // Orphan slug: content/course.ts no longer has this course. Loud, because
      // a silently missing line looks identical to an empty cart.
      console.warn(
        `[cart] Bỏ qua kỳ "${cohort.ky}" trỏ tới khóa không tồn tại: "${cohort.courseSlug}".`,
      );
      droppedIds.push(id);
      continue;
    }

    const seatsLeft = Math.max(0, cohort.capacity - (taken.get(id) ?? 0));
    lines.push({
      cohortId: cohort.id,
      courseSlug: cohort.courseSlug,
      courseTitle: course.title,
      ky: cohort.ky,
      khaiGiang: cohort.khaiGiang,
      lichHoc: cohort.lichHoc,
      priceVnd: cohort.priceVnd,
      seatsLeft,
      blocked: held.has(id)
        ? "already_enrolled"
        : seatsLeft <= 0
          ? "no_seats"
          : null,
    });
  }

  const buyable = lines.filter((l) => l.blocked === null);
  return {
    lines,
    buyable,
    totalVnd: buyable.reduce((sum, l) => sum + l.priceVnd, 0),
    droppedIds,
  };
}
