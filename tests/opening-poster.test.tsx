import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { courses } from "@/content/course";
import { OpeningPoster } from "@/components/sections/opening-poster";

const AIQT = "nckh-ung-dung-ai-xuat-ban-quoc-te";

const bySlug = (slug: string) => {
  const course = courses.find((item) => item.slug === slug);
  if (!course) throw new Error(`Không tìm thấy khóa ${slug}`);
  return course;
};

describe("<OpeningPoster>", () => {
  it("hiện ảnh poster khi có khóa đang mở", () => {
    const html = renderToStaticMarkup(
      <OpeningPoster
        openCourses={[{ course: bySlug(AIQT), remaining: 15 }]}
      />,
    );

    expect(html).toContain("data-opening-poster");
    // `next/image` mã hóa `src` thành `/_next/image?url=%2Fimages%2F...`, nên
    // bám vào tên file trần thay vì nguyên đường dẫn có dấu `/`.
    expect(html).toContain("lich-khai-giang-09-10-2026.png");
    expect(html).toContain("Lịch khai giảng các khóa đang mở đăng ký");
  });

  it("không có khóa nào đang mở thì không dựng gì cả", () => {
    expect(renderToStaticMarkup(<OpeningPoster openCourses={[]} />)).toBe("");
  });
});
