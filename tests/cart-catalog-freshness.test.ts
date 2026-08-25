import { beforeEach, describe, expect, it, vi } from "vitest";
import { courses } from "@/content/course";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  queryRaw: vi.fn(),
  seatsTaken: 0,
}));

vi.mock("next/cache", () => ({
  // Memoize thật: nếu configuredCourses bị bọc lại, lần gọi thứ hai sẽ không
  // chạm database và các test bên dưới fail — đó chính là cái bẫy cần đặt.
  unstable_cache: (loader: (...args: never[]) => unknown) => {
    let cached: unknown;
    return async (...args: never[]) => (cached ??= await loader(...args));
  },
}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    course: { findMany: mocks.findMany },
    $queryRaw: mocks.queryRaw,
  },
}));

import { loadCourseCatalog } from "@/lib/cart";

const slug = courses[0].slug;
const id = "course-1";

function row(priceVnd: number, capacity = 20) {
  return { id, code: courses[0].code, slug, capacity, priceVnd, status: "open" as const };
}

describe("catalog giỏ hàng luôn đọc cấu hình giao dịch mới nhất", () => {
  beforeEach(() => {
    mocks.findMany.mockReset();
    mocks.queryRaw.mockReset();
    mocks.seatsTaken = 0;
    mocks.queryRaw.mockImplementation((strings: TemplateStringsArray) => {
      const sql = strings.join(" ");
      return sql.includes("count(*)::bigint")
        ? [{ courseId: id, held: BigInt(mocks.seatsTaken) }]
        : [];
    });
  });

  it("hiện giá mới ngay ở lượt đọc thứ hai", async () => {
    mocks.findMany
      .mockResolvedValueOnce([row(1_100_000)])
      .mockResolvedValueOnce([row(1_500_000)]);

    await loadCourseCatalog("user-1");
    const second = await loadCourseCatalog("user-1");

    expect(second.find((course) => course.id === id)?.priceVnd).toBe(1_500_000);
  });

  it("chạm course.findMany đúng một lần cho mỗi lượt đọc catalog", async () => {
    mocks.findMany
      .mockResolvedValueOnce([row(1_100_000)])
      .mockResolvedValueOnce([row(1_500_000)]);

    await loadCourseCatalog("user-1");
    await loadCourseCatalog("user-1");

    expect(mocks.findMany).toHaveBeenCalledTimes(2);
  });

  it("phản ánh sức chứa mới thay vì giữ trạng thái mua được đã cache", async () => {
    mocks.seatsTaken = 10;
    mocks.findMany
      .mockResolvedValueOnce([row(1_100_000, 20)])
      .mockResolvedValueOnce([row(1_100_000, 5)]);

    const first = await loadCourseCatalog("user-1");
    const second = await loadCourseCatalog("user-1");

    expect(first.find((course) => course.id === id)?.availability).toBe("buyable");
    expect(second.find((course) => course.id === id)?.availability).toBe("full");
  });
});
