import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findMany: vi.fn() }));

vi.mock("next/cache", () => ({
  unstable_cache: (loader: (...args: never[]) => unknown) => loader,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { courseReview: { findMany: mocks.findMany } },
}));

import { publishedReviews } from "@/lib/reviews";

describe("đánh giá công khai trên thẻ khóa học", () => {
  beforeEach(() => mocks.findMany.mockReset());

  it("chỉ trả tối đa năm đánh giá mới nhất cho mỗi khóa", async () => {
    mocks.findMany.mockResolvedValue(
      Array.from({ length: 7 }, (_, index) => ({
        id: `review-${index + 1}`,
        rating: 5,
        comment: `Nhận xét ${index + 1}`,
        createdAt: new Date(Date.UTC(2026, 7, 24 - index)),
        user: { name: `Học viên ${index + 1}` },
        course: { slug: "research-foundations" },
      })),
    );

    const result = await publishedReviews();

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100, orderBy: { createdAt: "desc" } }),
    );
    expect(result["research-foundations"]).toHaveLength(5);
    expect(result["research-foundations"].map((review) => review.id)).toEqual([
      "review-1",
      "review-2",
      "review-3",
      "review-4",
      "review-5",
    ]);
    expect(result["research-foundations"][0].createdAt).toBeTypeOf("number");
  });
});
