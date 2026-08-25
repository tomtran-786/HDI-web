import { beforeEach, describe, expect, it, vi } from "vitest";
import { courses } from "@/content/course";

const mocks = vi.hoisted(() => ({
  configuredCourses: vi.fn(),
  seatsTaken: vi.fn(),
  heldByUser: vi.fn(),
  cookies: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@/lib/course-sales", () => ({
  configuredCourses: mocks.configuredCourses,
  seatsTaken: mocks.seatsTaken,
  heldByUser: mocks.heldByUser,
}));
vi.mock("@/lib/prisma", () => ({ prisma: { course: { findMany: vi.fn() } } }));

import { loadCart } from "@/lib/cart";

describe("course cart catalog", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
  });

  it("shows every marketing course but prices and gates it from the database", async () => {
    const [first, second, third, fourth] = courses;
    mocks.configuredCourses.mockResolvedValue([
      {
        id: "course-open",
        code: first.code,
        slug: first.slug,
        capacity: 2,
        priceVnd: 450_000,
        status: "open",
      },
      {
        id: "course-full",
        code: second.code,
        slug: second.slug,
        capacity: 1,
        priceVnd: 650_000,
        status: "open",
      },
      {
        id: "course-owned",
        code: third.code,
        slug: third.slug,
        capacity: 20,
        priceVnd: 750_000,
        status: "closed",
      },
      {
        id: "course-draft",
        code: fourth.code,
        slug: fourth.slug,
        capacity: 20,
        priceVnd: 850_000,
        status: "draft",
      },
    ]);
    mocks.seatsTaken.mockResolvedValue(
      new Map([
        ["course-open", 1],
        ["course-full", 1],
      ]),
    );
    mocks.heldByUser.mockResolvedValue(new Map([["course-owned", "paid"]]));

    const result = await loadCart(
      ["course-open", "course-full", "course-owned", "gone"],
      "user-1",
    );

    expect(result.catalog).toHaveLength(courses.length);
    expect(result.catalog.find((item) => item.id === "course-open")).toMatchObject({
      availability: "buyable",
      priceVnd: 450_000,
      seatsLeft: 1,
    });
    expect(result.catalog.find((item) => item.id === "course-full")).toMatchObject({
      availability: "full",
      seatsLeft: 0,
    });
    expect(result.catalog.find((item) => item.id === "course-owned")).toMatchObject({
      availability: "already_enrolled",
    });
    expect(result.catalog.find((item) => item.id === "course-draft")).toMatchObject({
      availability: "not_open",
    });
    expect(result.catalog.find((item) => item.id === null)).toMatchObject({
      availability: "not_open",
    });
    expect(result.staleIds).toEqual(["course-full", "course-owned", "gone"]);
    expect(result.totalVnd).toBe(450_000);
  });
});
