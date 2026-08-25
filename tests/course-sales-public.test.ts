import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  queryRaw: vi.fn(),
  readPublishedReviews: vi.fn(),
}));

vi.mock("next/cache", () => ({
  unstable_cache: (loader: (...args: never[]) => unknown) => loader,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    course: { findMany: mocks.findMany },
    $queryRaw: mocks.queryRaw,
  },
}));
vi.mock("@/lib/reviews", () => ({
  readPublishedReviews: mocks.readPublishedReviews,
}));

import { landingCourseData } from "@/lib/course-sales";

describe("dữ liệu bán khóa học công khai", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.readPublishedReviews.mockResolvedValue({ summaries: {}, reviews: {} });
  });

  it("tính số chỗ còn lại bằng cùng tập ghi danh đang giữ chỗ", async () => {
    mocks.findMany.mockResolvedValue([
      {
        id: "course-1",
        slug: "nckh-ung-dung-ai-xuat-ban-quoc-te",
        capacity: 15,
        priceVnd: 3_000_000,
        status: "open",
      },
    ]);
    mocks.queryRaw.mockResolvedValue([{ courseId: "course-1", held: BigInt(4) }]);

    const result = await landingCourseData();
    expect(result.seatsLeft).toEqual({
      "nckh-ung-dung-ai-xuat-ban-quoc-te": 11,
    });
    expect(result.availability).toEqual({
      "nckh-ung-dung-ai-xuat-ban-quoc-te": "buyable",
    });
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.not.objectContaining({ communityUrl: true }),
      }),
    );
  });

  it("đánh dấu full và chặn số âm khi số giữ chỗ chạm sức chứa", async () => {
    mocks.findMany.mockResolvedValue([
      {
        id: "course-1",
        slug: "nckh-ung-dung-ai-xuat-ban-quoc-te",
        capacity: 15,
        priceVnd: 3_000_000,
        status: "open",
      },
    ]);
    mocks.queryRaw.mockResolvedValue([{ courseId: "course-1", held: BigInt(16) }]);

    const result = await landingCourseData();
    expect(result.seatsLeft["nckh-ung-dung-ai-xuat-ban-quoc-te"]).toBe(0);
    expect(result.availability["nckh-ung-dung-ai-xuat-ban-quoc-te"]).toBe("full");
  });
});
