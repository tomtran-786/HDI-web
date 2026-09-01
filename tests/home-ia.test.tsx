import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  landingCourseData: vi.fn(),
  openCart: vi.fn(),
}));

vi.mock("@/lib/analytics", () => ({
  trackCourseModal: vi.fn(),
  trackCta: vi.fn(),
}));
vi.mock("@/lib/course-sales", () => ({
  landingCourseData: mocks.landingCourseData,
}));
vi.mock("@/components/cart-provider", () => ({
  useCart: () => ({ openCart: mocks.openCart }),
}));

import Home from "@/app/page";
import AboutHdiPage from "@/app/ve-hdi/page";

describe("kiến trúc nội dung homepage và Về HDI", () => {
  beforeEach(() => {
    mocks.landingCourseData.mockReset();
    mocks.landingCourseData.mockResolvedValue({
      summaries: {},
      reviews: {},
      availability: {
        "nckh-ung-dung-ai-xuat-ban-quoc-te": "buyable",
        "training-tieu-luan-nckh-kltn": "not_open",
        "nckh-chuyen-sau-spss": "not_open",
        "stata-kinh-te-luong": "not_open",
        "viet-bai-tap-chi": "not_open",
        "viet-bao-cao-khoa-hoc": "not_open",
        "ung-dung-chatgpt-nckh": "not_open",
      },
      seatsLeft: { "nckh-ung-dung-ai-xuat-ban-quoc-te": 15 },
    });
  });

  it("homepage đặt khóa đang mở ngay sau hero và hiện số chỗ thật", async () => {
    const html = renderToStaticMarkup(await Home());

    expect(html).toContain('id="dich-vu"');
    expect(html).toContain('id="chuong-trinh"');
    expect(html).toContain("Đồng hành nghiên cứu");
    expect(html).toContain("Hỗ trợ bản thảo");

    expect(html).toContain(
      'href="/khoa-hoc/nckh-ung-dung-ai-xuat-ban-quoc-te"',
    );
    expect(html).toContain("Còn 15 chỗ");
    expect(html).toContain("3.000.000 đ");
    expect(html.indexOf('id="top"')).toBeLessThan(html.indexOf('id="khoa-hoc"'));
    expect(html.indexOf('id="khoa-hoc"')).toBeLessThan(
      html.indexOf('id="ve-chung-toi"'),
    );

    // Dải lịch khai giảng đứng giữa hero và mục khóa đang mở.
    expect(html.indexOf('id="top"')).toBeLessThan(html.indexOf("data-ticker"));
    expect(html.indexOf("data-ticker")).toBeLessThan(
      html.indexOf('id="khoa-hoc"'),
    );
    // Khẳng định theo ngày máy đọc được, KHÔNG theo chuỗi hiển thị: hero cũng
    // đang in tay "07/09/2026" (components/sections/hero.tsx:27), nên bám vào
    // chuỗi đó sẽ xanh kể cả khi dải hỏng hoàn toàn.
    expect(html).toMatch(/datetime="2026-09-07"/i);
    // TIEULUAN `not_open` trong mock: đã chốt ngày cũng không được lên dải.
    expect(html).not.toMatch(/datetime="2026-10-05"/i);
    expect(html).not.toContain("05/10/2026");
    expect(html).not.toContain("/khoa-hoc/training-tieu-luan-nckh-kltn");
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
    expect(html).not.toContain("zalo.me/g/");
    expect(html).not.toContain("drive.google.com/drive/folders/");
  });

  it("ẩn section khi khóa đã hết chỗ", async () => {
    mocks.landingCourseData.mockResolvedValueOnce({
      summaries: {},
      reviews: {},
      availability: { "nckh-ung-dung-ai-xuat-ban-quoc-te": "full" },
      seatsLeft: { "nckh-ung-dung-ai-xuat-ban-quoc-te": 0 },
    });

    const html = renderToStaticMarkup(await Home());
    expect(html).not.toContain('id="khoa-hoc"');
    expect(html).not.toContain("Còn 0 chỗ");
    // Dải và mục khóa dùng chung một cái cổng: mất mục thì cũng phải mất dải,
    // không để lại một dải trơ trọi phía trên khoảng trống.
    expect(html).not.toContain("data-ticker");
  });

  it("không dựng số ghế giả khi database lỗi", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.landingCourseData.mockRejectedValueOnce(new Error("database offline"));

    const html = renderToStaticMarkup(await Home());
    expect(html).not.toContain('id="khoa-hoc"');
    expect(html).not.toMatch(/Còn \d+ chỗ/);
    // Gãy ngay nếu sau này ai đó tách dải ra app/page.tsx với lần đọc dữ liệu
    // và nhánh catch riêng của nó.
    expect(html).not.toContain("data-ticker");
    consoleError.mockRestore();
  });

  it("/ve-hdi chứa đội ngũ đầy đủ và các liên kết tài liệu", () => {
    const html = renderToStaticMarkup(<AboutHdiPage />);

    expect(html).toContain('id="doi-ngu"');
    expect(html).toContain("Dr. Tam Trinh");
    expect(html).toContain("xếp hạng C theo ABDC; ESCI Q1");
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
