import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/analytics", () => ({
  trackCourseModal: vi.fn(),
  trackCta: vi.fn(),
}));

import Home from "@/app/page";
import AboutHdiPage from "@/app/ve-hdi/page";

describe("kiến trúc nội dung homepage và Về HDI", () => {
  it("homepage chỉ có hai teaser dịch vụ và ba teaser khóa học", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain('id="dich-vu"');
    expect(html).toContain('id="chuong-trinh"');
    expect(html).toContain("Đồng hành nghiên cứu");
    expect(html).toContain("Hỗ trợ bản thảo");

    const featured = [
      "training-tieu-luan-nckh-kltn",
      "nckh-chuyen-sau-spss",
      "ung-dung-chatgpt-nckh",
    ];
    for (const slug of featured) {
      expect(html).toContain(`href="/khoa-hoc/${slug}"`);
    }
    expect(html).not.toContain("/khoa-hoc/stata-kinh-te-luong");
    expect(html).not.toContain("220.000 đ");
    expect(html).not.toContain("Đánh giá học viên");
    expect(html).not.toContain("Tuan Tran");
    expect(html).not.toContain("Economic Modelling");
    expect(html).toContain("/images/successful-target.svg");
    expect(html).not.toContain("/images/successful-target.webp");
    expect(html).toContain('id="faq"');
    expect(html).toContain("Khóa học và dịch vụ đồng hành nghiên cứu khác nhau thế nào?");
    expect(html).toContain("Humanizing &amp; Proofreading đã có bảng giá chưa?");
    expect(html.match(/<details/g)).toHaveLength(8);
  });

  it("/ve-hdi chứa đội ngũ đầy đủ và các liên kết tài liệu", () => {
    const html = renderToStaticMarkup(<AboutHdiPage />);

    expect(html).toContain('id="doi-ngu"');
    expect(html).toContain("Dr. Tam Trinh");
    expect(html).toContain("Tuan Tran");
    expect(html).toContain('href="/docs/cv.pdf"');
    expect(html).toContain('href="/docs/teaching-statement.pdf"');
    expect(html).toContain('href="/docs/resume-tuan-tran.pdf"');
    expect(html).toContain("tomtran-portfolio.vercel.app");
    expect(html).toContain("tuan-tran.jpg");
    expect(html).toContain('alt="Chân dung Tuan Tran"');
    expect(html).not.toContain("←");
    expect(html).not.toContain('href="#doi-ngu"');
    expect(html).not.toContain('href="/#ve-chung-toi"');
    expect(html.match(/href="\/cong-bo"/g)).toHaveLength(1);
    expect(html.match(/href="\/#lien-he"/g)).toHaveLength(1);
  });
});
