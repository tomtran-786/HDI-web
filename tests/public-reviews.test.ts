import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ queryRaw: vi.fn() }));

vi.mock("next/cache", () => ({
  unstable_cache: (loader: (...args: never[]) => unknown) => loader,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { $queryRaw: mocks.queryRaw },
}));

import { publishedReviews } from "@/lib/reviews";

function review(
  id: string,
  slug: string,
  author: string | null = `Học viên ${id}`,
) {
  return {
    id,
    slug,
    rating: 5,
    comment: `Nhận xét ${id}`,
    createdAt: new Date(Date.UTC(2026, 7, 24)),
    author,
  };
}

describe("đánh giá công khai trên thẻ khóa học", () => {
  beforeEach(() => mocks.queryRaw.mockReset());

  it("giữ đủ năm đánh giá mới nhất cho từng khóa trong cùng một truy vấn", async () => {
    mocks.queryRaw.mockResolvedValue([
      ...Array.from({ length: 5 }, (_, index) => review(`a-${index}`, "course-a")),
      ...Array.from({ length: 5 }, (_, index) => review(`b-${index}`, "course-b")),
    ]);

    const result = await publishedReviews();

    expect(result["course-a"]).toHaveLength(5);
    expect(result["course-b"]).toHaveLength(5);
    expect(mocks.queryRaw).toHaveBeenCalledTimes(1);
    const sql = (mocks.queryRaw.mock.calls[0][0] as TemplateStringsArray)
      .join(" ")
      .toLowerCase();
    expect(sql).toContain("row_number() over");
    expect(sql).toMatch(/r\.rn\s*<=\s*5/);
  });

  it("không đệm một khóa chỉ có hai đánh giá", async () => {
    mocks.queryRaw.mockResolvedValue([
      review("one", "course-a"),
      review("two", "course-a"),
    ]);

    const result = await publishedReviews();

    expect(result["course-a"]).toHaveLength(2);
  });

  it.each([null, "  "])(
    "dùng tên ẩn danh khi tên công khai là %j",
    async (author) => {
      mocks.queryRaw.mockResolvedValue([review("one", "course-a", author)]);

      const result = await publishedReviews();

      expect(result["course-a"][0].author).toBe("Học viên");
    },
  );

  it("chuyển createdAt thành epoch milliseconds trước ranh giới cache/RSC", async () => {
    mocks.queryRaw.mockResolvedValue([review("one", "course-a")]);

    const result = await publishedReviews();

    expect(result["course-a"][0].createdAt).toBeTypeOf("number");
    expect(result["course-a"][0].createdAt).toBe(Date.UTC(2026, 7, 24));
  });
});
