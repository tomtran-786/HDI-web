import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { courses } from "@/content/course";
import { enrolledCount, enrolledLabel } from "@/content/course-hype";
import { formatCount } from "@/lib/format";

vi.mock("@/lib/analytics", () => ({
  trackCourseModal: vi.fn(),
  trackCourseQuickView: vi.fn(),
  trackCta: vi.fn(),
}));
import { CourseCard } from "@/components/course-card";

const foundation = courses.find(
  (item) => item.slug === "training-tieu-luan-nckh-kltn",
)!;

describe("badge availability của thẻ khóa học", () => {
  it("fail-open khi không đọc được database", () => {
    const html = renderToStaticMarkup(
      <CourseCard course={foundation} availability={undefined} />,
    );

    expect(html).not.toContain("Chưa mở đăng ký");
    expect(html).toContain(
      `>${formatCount(enrolledCount[foundation.slug])}</span> ${enrolledLabel}`,
    );
    // Không đọc được thì không gắn nhãn trạng thái nào lên banner.
    expect(html).not.toContain("Đã hết chỗ");
  });

  it("vẫn hiển thị trạng thái hết chỗ khi database trả về rõ ràng", () => {
    const html = renderToStaticMarkup(
      <CourseCard course={courses[0]} availability="full" />,
    );

    expect(html).toContain("Đã hết chỗ");
  });
});

describe("thẻ khóa học dùng chung", () => {
  it("thẻ gọn: tên trên banner, một nút \"Tìm hiểu thêm\", link thật, chưa có modal", () => {
    const html = renderToStaticMarkup(
      <CourseCard course={foundation} availability="buyable" />,
    );

    expect(html).toContain(`href="/khoa-hoc/${foundation.slug}"`);
    expect(html).toContain(foundation.title.replace("&", "&amp;"));
    expect(html).toContain("Tìm hiểu thêm");
    // Đăng ký nằm trong modal, không nằm trên thẻ.
    expect(html).not.toContain("Đăng ký ngay");
    expect(html).not.toContain("<dialog");
  });

  it("có số chỗ thật thì in \"Còn N chỗ\" thay cho badge trạng thái", () => {
    const html = renderToStaticMarkup(
      <CourseCard course={foundation} availability="buyable" seatsLeft={7} />,
    );

    expect(html).toContain("Còn 7 chỗ");
    expect(html).not.toContain(">Còn chỗ<");
  });

  it("giá ưu đãi trên thẻ vẫn đứng trước giá gốc gạch ngang, kèm điều kiện", () => {
    const deal = foundation.price.deal!;
    const html = renderToStaticMarkup(<CourseCard course={foundation} />);

    expect(html.indexOf(deal.amount)).toBeLessThan(
      html.indexOf(foundation.price.amount),
    );
    expect(html).toContain(deal.condition);
    const struck = html.match(/<s\b[^>]*>.*?<\/s>/g) ?? [];
    expect(struck.some((tag) => tag.includes(foundation.price.amount))).toBe(true);
  });
});
