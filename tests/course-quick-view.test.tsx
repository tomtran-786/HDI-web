import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FACT_LABELS, courses } from "@/content/course";

vi.mock("@/lib/analytics", () => ({
  trackCourseModal: vi.fn(),
  trackCta: vi.fn(),
}));
vi.mock("@/components/cart-provider", () => ({
  useCart: () => ({ openCart: vi.fn() }),
}));

import { CourseQuickView } from "@/components/course-quick-view";

function render(slug: string, availability?: "buyable" | "not_open") {
  const course = courses.find((item) => item.slug === slug)!;
  const html = renderToStaticMarkup(
    <CourseQuickView course={course} availability={availability} onClose={() => {}} />,
  );
  return { course, html };
}

describe("modal xem nhanh khóa học", () => {
  it("in bản gọn: facts, bốn kết quả đầu, tên mọi module và link sang trang chi tiết", () => {
    const { course, html } = render("nckh-chuyen-sau-spss", "buyable");

    expect(html).toContain("<dialog");
    expect(html).toContain(course.title.replace("&", "&amp;"));
    for (const label of FACT_LABELS) expect(html).toContain(`${label}: `);

    expect(course.outcomes.length).toBeGreaterThan(4);
    for (const outcome of course.outcomes.slice(0, 4)) expect(html).toContain(outcome);
    expect(html).not.toContain(course.outcomes[4]);

    course.phases.forEach((phase, i) => {
      expect(html).toContain(`Module ${i + 1}: ${phase.name}`);
    });
    // Bản gọn không in chủ đề con của module.
    expect(html).not.toContain("Từ vấn đề thực tiễn đến câu hỏi và mục tiêu nghiên cứu");

    expect(html).toContain(`href="/khoa-hoc/${course.slug}"`);
    expect(html).toContain("Xem trang chi tiết");
    // Hai CTA của modal là hai pill gọn, không phải nút đầy bề ngang.
    expect(html).toContain("Đăng ký ngay");
    expect(html).toContain("Nhắn Zalo");
    expect(html).not.toContain("flex-1");
  });

  it("không có nút đăng ký chết khi khóa chưa mở", () => {
    const { html } = render("nckh-chuyen-sau-spss", "not_open");

    expect(html).toContain("Chưa mở đăng ký");
    expect(html).not.toContain("Đăng ký ngay");
    expect(html).toContain("Nhắn Zalo");
  });

  it("giữ quy ước giá ưu đãi: giá giảm trước, giá gốc trong <s>, kèm điều kiện", () => {
    const { course, html } = render("training-tieu-luan-nckh-kltn", "buyable");
    const deal = course.price.deal!;

    expect(html.indexOf(deal.amount)).toBeLessThan(html.indexOf(course.price.amount));
    expect(html).toContain(deal.condition);
    const struck = html.match(/<s\b[^>]*>.*?<\/s>/g) ?? [];
    expect(struck.some((tag) => tag.includes(course.price.amount))).toBe(true);
    expect(struck.some((tag) => tag.includes(deal.amount))).toBe(false);
  });
});
