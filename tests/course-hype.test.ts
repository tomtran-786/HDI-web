import { describe, expect, it } from "vitest";
import { COURSE_SLUGS, courses } from "@/content/course";
import { enrolledCount } from "@/content/course-hype";
import { formatCount } from "@/lib/format";

describe("số học viên quảng cáo", () => {
  it("giữ mảng khóa học đồng bộ với nguồn slug chuẩn", () => {
    expect(courses.map((course) => course.slug)).toEqual(COURSE_SLUGS);
  });

  it("giữ mã khóa ổn định, dễ đọc và không trùng", () => {
    expect(courses.map((course) => course.code)).toEqual([
      "AIQT",
      "TIEULUAN",
      "SPSS",
      "STATA",
      "TAPCHI",
      "BAOCAO",
      "CHATGPT",
    ]);
    expect(new Set(courses.map((course) => course.code)).size).toBe(courses.length);
    for (const course of courses) expect(course.code).toMatch(/^[A-Z0-9]{2,12}$/);
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
