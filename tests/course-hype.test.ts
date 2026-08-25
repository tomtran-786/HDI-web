import { describe, expect, it } from "vitest";
import { COURSE_SLUGS, courses } from "@/content/course";
import { enrolledCount } from "@/content/course-hype";
import { formatCount } from "@/lib/format";

describe("số học viên quảng cáo", () => {
  it("giữ mảng khóa học đồng bộ với nguồn slug chuẩn", () => {
    expect(courses.map((course) => course.slug)).toEqual(COURSE_SLUGS);
  });

  it("chỉ dùng số marketing khi HDI đã cung cấp", () => {
    expect(enrolledCount["nckh-ung-dung-ai-xuat-ban-quoc-te"]).toBeUndefined();
    for (const [slug, count] of Object.entries(enrolledCount)) {
      expect(COURSE_SLUGS).toContain(slug);
      expect(Number.isInteger(count)).toBe(true);
      expect(count).toBeGreaterThan(0);
    }
  });

  it("định dạng số theo vi-VN", () => {
    expect(formatCount(1428)).toBe("1.428");
  });
});
