import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ queryRaw: vi.fn() }));

vi.mock("next/cache", () => ({
  unstable_cache: (loader: (...args: never[]) => unknown) => loader,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { $queryRaw: mocks.queryRaw },
}));

import { publishedReviews, readPublishedReviews } from "@/lib/reviews";

function review(
  id: string,
  slug: string,
  author: string | null = `Học viên ${id}`,
  aggregate: { average?: number; total?: bigint } = {},
) {
  return {
    id,
    slug,
    rating: 5,
    comment: `Nhận xét ${id}`,
    createdAt: new Date(Date.UTC(2026, 7, 24)),
    author,
    // Window function trên nguyên partition — Postgres lặp lại cùng một cặp
    // giá trị này trên mọi dòng của cùng một khóa.
    average: aggregate.average ?? 5,
    total: aggregate.total ?? BigInt(1),
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

  it("lấy cả điểm trung bình lẫn danh sách trong đúng một truy vấn", async () => {
    mocks.queryRaw.mockResolvedValue([
      review("a-1", "course-a", null, { average: 4.5, total: BigInt(12) }),
      review("a-2", "course-a", null, { average: 4.5, total: BigInt(12) }),
    ]);

    const { summaries, reviews } = await readPublishedReviews();

    expect(mocks.queryRaw).toHaveBeenCalledTimes(1);
    expect(reviews["course-a"]).toHaveLength(2);
    expect(summaries["course-a"]).toEqual({ average: 4.5, count: 12 });
  });

  it("đếm theo window function chứ không theo số dòng đã bị rn <= 5 cắt", async () => {
    // Một khóa có 30 đánh giá: truy vấn chỉ trả về 5 dòng, nhưng cột `total` do
    // count() OVER (PARTITION BY ...) tính trước khi cắt, nên vẫn là 30. Nếu
    // đếm bằng rows.length thì con số trên thẻ khóa học sẽ đứng yên ở 5.
    mocks.queryRaw.mockResolvedValue(
      Array.from({ length: 5 }, (_, index) =>
        review(`r-${index}`, "course-a", null, { average: 4.2, total: BigInt(30) }),
      ),
    );

    const { summaries } = await readPublishedReviews();

    expect(summaries["course-a"].count).toBe(30);
  });

  it("trả về object rỗng khi chưa có đánh giá nào được duyệt", async () => {
    mocks.queryRaw.mockResolvedValue([]);

    const { summaries, reviews } = await readPublishedReviews();

    expect(summaries).toEqual({});
    expect(reviews).toEqual({});
  });
});
