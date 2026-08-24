import { describe, expect, it } from "vitest";
import { COURSE_SLUGS, courses } from "@/content/course";
import { enrolledCount } from "@/content/course-hype";
import { formatCount } from "@/lib/format";

describe("số học viên quảng cáo", () => {
  it("giữ mảng khóa học đồng bộ với nguồn slug chuẩn", () => {
    expect(courses.map((course) => course.slug)).toEqual(COURSE_SLUGS);
  });

  it("có một số nguyên dương cho mọi khóa học", () => {
    for (const course of courses) {
      expect(Number.isInteger(enrolledCount[course.slug])).toBe(true);
      expect(enrolledCount[course.slug]).toBeGreaterThan(0);
    }
  });

  it("định dạng số theo vi-VN", () => {
    expect(formatCount(1428)).toBe("1.428");
  });
});
