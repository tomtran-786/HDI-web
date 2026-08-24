import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { courses } from "@/content/course";
import { enrolledCount } from "@/content/course-hype";
import { formatCount } from "@/lib/format";

vi.mock("@/lib/analytics", () => ({
  trackCourseModal: vi.fn(),
  trackCta: vi.fn(),
}));
vi.mock("@/components/cart-provider", () => ({
  useCart: () => ({ openCart: vi.fn() }),
}));

import { CourseCard } from "@/components/course-card";

describe("badge availability của thẻ khóa học", () => {
  it("fail-open khi không đọc được database", () => {
    const html = renderToStaticMarkup(
      <CourseCard course={courses[0]} availability={undefined} />,
    );

    expect(html).not.toContain("Chưa mở đăng ký");
    expect(html).toContain(formatCount(enrolledCount[courses[0].slug]));
  });

  it("vẫn hiển thị trạng thái hết chỗ khi database trả về rõ ràng", () => {
    const html = renderToStaticMarkup(
      <CourseCard course={courses[0]} availability="full" />,
    );

    expect(html).toContain("Đã hết chỗ");
  });
});
