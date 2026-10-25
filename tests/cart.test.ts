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

  it("shows only courses that are on sale, priced and gated from the database", async () => {
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

    // Khóa chưa mở bán (nháp, hoặc chưa có dòng DB) không hiện ở giỏ, trừ khi
    // đang nằm trong cookie của người này — xem test kế tiếp.
    expect(result.catalog.map((item) => item.id)).toEqual([
      "course-open",
      "course-full",
      "course-owned",
    ]);
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
    expect(result.catalog.find((item) => item.id === "course-draft")).toBeUndefined();
    expect(result.catalog.find((item) => item.id === null)).toBeUndefined();
    expect(result.staleIds).toEqual(["course-full", "course-owned", "gone"]);
    expect(result.totalVnd).toBe(450_000);
  });

  it("keeps a closed course that is still in the cart cookie so it can be reported as removed", async () => {
    const [first, second] = courses;
    mocks.configuredCourses.mockResolvedValue([
      {
        id: "course-open",
        code: first.code,
        slug: first.slug,
        capacity: 10,
        priceVnd: 300_000,
        status: "open",
      },
      {
        id: "course-closed",
        code: second.code,
        slug: second.slug,
        capacity: 10,
        priceVnd: 400_000,
        status: "closed",
      },
    ]);
    mocks.seatsTaken.mockResolvedValue(new Map());
    mocks.heldByUser.mockResolvedValue(new Map());

    const result = await loadCart(["course-closed"], "user-1");

    expect(result.catalog.map((item) => item.id)).toEqual([
      "course-open",
      "course-closed",
    ]);
    expect(result.catalog[1].availability).toBe("not_open");
    expect(result.staleIds).toEqual(["course-closed"]);
    expect(result.totalVnd).toBe(0);
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
