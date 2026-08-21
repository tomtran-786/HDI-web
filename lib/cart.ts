import { cookies } from "next/headers";
import { courses as authoredCourses } from "@/content/course";
import { configuredCourses, heldByUser, seatsTaken } from "./course-sales";
import {
  CART_COOKIE,
  CART_MAX_AGE,
  parseCart,
  serializeCart,
} from "./cart-cookie";

export type CourseAvailability =
  | "buyable"
  | "not_open"
  | "full"
  | "pending"
  | "already_enrolled";

export type CatalogCourse = {
  id: string | null;
  slug: string;
  title: string;
  priceVnd: number;
  capacity: number | null;
  seatsLeft: number | null;
  availability: CourseAvailability;
};

export type CartView = {
  catalog: CatalogCourse[];
  selected: CatalogCourse[];
  totalVnd: number;
  /** Cookie ids that no longer resolve or no longer remain buyable. */
  staleIds: string[];
};

export async function readCartIds() {
  const jar = await cookies();
  return parseCart(jar.get(CART_COOKIE)?.value);
}

/** Server-side write for checkout, where the browser cannot update the cookie. */
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
    httpOnly: false,
  });
}

/**
 * Build the complete shopping catalog without ever selecting course secrets.
 * Authored content determines which products may appear; the database decides
 * whether they can be bought and at what price.
 */
export async function loadCourseCatalog(userId: string): Promise<CatalogCourse[]> {
  const configured = await configuredCourses();
  const ids = configured.map((course) => course.id);
  const [taken, held] = await Promise.all([
    seatsTaken(ids),
    heldByUser(userId, ids),
  ]);
  const bySlug = new Map(configured.map((course) => [course.slug, course]));

  for (const row of configured) {
    if (!authoredCourses.some((course) => course.slug === row.slug)) {
      console.warn(`[cart] Bỏ qua cấu hình khóa không còn trong content/course.ts: "${row.slug}".`);
    }
  }

  return authoredCourses.map((authored) => {
    const row = bySlug.get(authored.slug);
    if (!row) {
      return {
        id: null,
        slug: authored.slug,
        title: authored.title,
        priceVnd: authored.price.vnd,
        capacity: null,
        seatsLeft: null,
        availability: "not_open" as const,
      };
    }

    const seatsLeft = Math.max(0, row.capacity - (taken.get(row.id) ?? 0));
    const mine = held.get(row.id);
    const availability: CourseAvailability =
      mine === "pending"
        ? "pending"
        : mine === "paid"
          ? "already_enrolled"
          : row.status !== "open"
            ? "not_open"
            : seatsLeft <= 0
              ? "full"
              : "buyable";

    return {
      id: row.id,
      slug: row.slug,
      title: authored.title,
      priceVnd: row.priceVnd,
      capacity: row.capacity,
      seatsLeft,
      availability,
    };
  });
}

export async function loadCart(ids: string[], userId: string): Promise<CartView> {
  const catalog = await loadCourseCatalog(userId);
  const byId = new Map(
    catalog.flatMap((course) => (course.id ? [[course.id, course] as const] : [])),
  );
  const selected = ids.flatMap((id) => {
    const course = byId.get(id);
    return course ? [course] : [];
  });
  const staleIds = ids.filter((id) => byId.get(id)?.availability !== "buyable");
  return {
    catalog,
    selected,
    staleIds,
    totalVnd: selected
      .filter((course) => course.availability === "buyable")
      .reduce((sum, course) => sum + course.priceVnd, 0),
  };
}
