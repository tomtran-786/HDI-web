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
    mocks.heldByUser.mockResolvedValue(
      new Map([["course-owned", { status: "paid", orderCode: null }]]),
    );

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

  /**
   * Mã đơn phải đi cùng nhãn "Đang chờ thanh toán".
   *
   * Dòng bị khóa không bao giờ vào được `selected`, nên nút Thanh toán không bấm
   * được, nên lời từ chối `already_enrolled` — chỗ duy nhất còn lại từng in ra
   * mã đơn — không bao giờ chạy. Thiếu con số này là giỏ hàng trở lại thành ngõ
   * cụt mà học viên gặp chiều 02/09/2026.
   */
  it("carries the blocking order code onto a pending course row", async () => {
    const [first, second] = courses;
    mocks.configuredCourses.mockResolvedValue([
      {
        id: "course-mine",
        code: first.code,
        slug: first.slug,
        capacity: 20,
        priceVnd: 300_000,
        status: "open",
      },
      {
        id: "course-theirs",
        code: second.code,
        slug: second.slug,
        capacity: 20,
        priceVnd: 300_000,
        status: "open",
      },
    ]);
    mocks.seatsTaken.mockResolvedValue(new Map());
    mocks.heldByUser.mockResolvedValue(
      new Map([
        ["course-mine", { status: "pending", orderCode: 100035 }],
        // Ghế nhóm do người khác trả tiền: vẫn khóa dòng, nhưng không có đơn
        // nào người này mở được.
        ["course-theirs", { status: "pending", orderCode: null }],
      ]),
    );

    const result = await loadCart([], "user-1");

    expect(result.catalog.find((item) => item.id === "course-mine")).toMatchObject({
      availability: "pending",
      pendingOrderCode: 100035,
    });
    expect(result.catalog.find((item) => item.id === "course-theirs")).toMatchObject({
      availability: "pending",
      pendingOrderCode: null,
    });
  });
});
