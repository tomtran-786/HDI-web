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
vi.mock("@/components/cart-provider", () => ({
  useCart: () => ({ openCart: vi.fn() }),
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
    // Không đọc được thì không gắn nhãn trạng thái nào lên banner, và vẫn cho
    // bấm đăng ký — createOrder mới là chốt chặn.
    expect(html).not.toContain("Đã hết chỗ");
    expect(html).toContain("Đăng ký ngay");
  });

  it("vẫn hiển thị trạng thái hết chỗ khi database trả về rõ ràng", () => {
    const html = renderToStaticMarkup(
      <CourseCard course={courses[0]} availability="full" />,
    );

    expect(html).toContain("Đã hết chỗ");
    // Hết chỗ thì không có nút đăng ký chết; nút chân thẻ mở xem nhanh.
    expect(html).toContain("Xem nhanh");
    expect(html).not.toContain("Đăng ký ngay");
  });
});

describe("khóa chưa mở bán", () => {
  it("thẻ không render gì: người dùng cuối không thấy khóa, tên, giá hay link", () => {
    const html = renderToStaticMarkup(
      <CourseCard course={foundation} availability="not_open" />,
    );

    expect(html).toBe("");
  });

  it("khóa hết chỗ vẫn là khóa đã mở bán nên thẻ vẫn hiện", () => {
    const html = renderToStaticMarkup(
      <CourseCard course={foundation} availability="full" />,
    );

    expect(html).toContain(foundation.title.replace("&", "&amp;"));
  });
});

describe("thẻ khóa học dùng chung", () => {
  it("thẻ gọn: tên trên banner, nút \"Đăng ký ngay\", link thật, chưa có modal", () => {
    const html = renderToStaticMarkup(
      <CourseCard course={foundation} availability="buyable" />,
    );

    expect(html).toContain(`href="/khoa-hoc/${foundation.slug}"`);
    expect(html).toContain(foundation.title.replace("&", "&amp;"));
    expect(html).toContain("Đăng ký ngay");
    expect(html).not.toContain("Tìm hiểu thêm");
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
