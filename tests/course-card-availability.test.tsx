import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { courses } from "@/content/course";
import { enrolledCount } from "@/content/course-hype";
import { formatCount } from "@/lib/format";

vi.mock("@/lib/analytics", () => ({
  trackCourseModal: vi.fn(),
}));

import { CourseCard } from "@/components/course-card";

describe("badge availability của thẻ khóa học", () => {
  it("fail-open khi không đọc được database", () => {
    const course = courses.find(
      (item) => item.slug === "training-tieu-luan-nckh-kltn",
    )!;
    const html = renderToStaticMarkup(
      <CourseCard course={course} availability={undefined} />,
    );

    expect(html).not.toContain("Chưa mở đăng ký");
    expect(html).toContain(formatCount(enrolledCount[course.slug]!));
  });

  it("vẫn hiển thị trạng thái hết chỗ khi database trả về rõ ràng", () => {
    const html = renderToStaticMarkup(
      <CourseCard course={courses[0]} availability="full" />,
    );

    expect(html).toContain("Đã hết chỗ");
  });
});
