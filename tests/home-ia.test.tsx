import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  landingCourseData: vi.fn(),
  openCart: vi.fn(),
}));

vi.mock("@/lib/analytics", () => ({
  trackCourseModal: vi.fn(),
  trackCourseQuickView: vi.fn(),
  trackCta: vi.fn(),
}));
vi.mock("@/lib/course-sales", () => ({
  landingCourseData: mocks.landingCourseData,
}));
vi.mock("@/components/cart-provider", () => ({
  useCart: () => ({ openCart: mocks.openCart }),
}));

import { enrolledCount, enrolledLabel } from "@/content/course-hype";
import { formatCount } from "@/lib/format";
import Home from "@/app/page";
import AboutHdiPage from "@/app/ve-hdi/page";

/**
 * Nền của từng `<section>` cấp trang, theo đúng thứ tự xuất hiện.
 *
 * `Section` chỉ in ra `bg-bg-soft` hoặc `bg-bg`, và Hero cũng là một `<section>`
 * mang `bg-bg`, nên đọc thẳng từ HTML là cách kiểm nhịp nền mà không phải tin
 * vào cờ `soft` cắm trong từng component.
 */
function sectionSurfaces(html: string) {
  return [...html.matchAll(/<section[^>]*class="([^"]*)"/g)]
    .map(([, className]) => className)
    .filter((className) => /\bbg-bg(-soft)?\b/.test(className))
    .map((className) => (className.includes("bg-bg-soft") ? "soft" : "plain"));
}

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
        "kinh-te-luong-stata-ai": "not_open",
        "viet-bai-tap-chi": "not_open",
        "viet-bao-cao-khoa-hoc": "not_open",
        "ung-dung-chatgpt-nckh": "not_open",
      },
      seatsLeft: { "nckh-ung-dung-ai-xuat-ban-quoc-te": 15 },
    });
  });

  it("bảng chương trình trong hero hiện khóa đang mở, số chỗ thật và phiên song song Turnitin", async () => {
    const html = renderToStaticMarkup(await Home());
    const heroEnd = html.indexOf("</section>", html.indexOf('id="top"'));

    expect(html).toContain('id="dich-vu"');
    expect(html).toContain('id="chuong-trinh"');
    expect(html).toContain("Đồng hành nghiên cứu");
    expect(html).toContain("Hỗ trợ bản thảo");

    // Bảng chương trình (#khoa-hoc) nằm ngay trong hero, không còn là section
    // riêng bên dưới và không còn poster ảnh lịch khai giảng.
    const programme = html.indexOf('id="khoa-hoc"');
    expect(programme).toBeGreaterThan(html.indexOf('id="top"'));
    expect(programme).toBeLessThan(heroEnd);
    expect(html).not.toContain("lich-khai-giang");
    expect(html).not.toContain("data-opening-poster");

    expect(html).toContain('href="/khoa-hoc/nckh-ung-dung-ai-xuat-ban-quoc-te"');
    expect(html).toContain("Còn 15 chỗ");
    expect(html).toContain("3.000.000 đ");
    // Dòng khóa mang cùng số "học viên đã đăng ký" với thẻ ở /khoa-hoc; chỉ
    // khóa đang mở có dòng nên khóa `not_open` không có số.
    const pill = (slug: keyof typeof enrolledCount) =>
      `>${formatCount(enrolledCount[slug])}</span> ${enrolledLabel}`;
    expect(html.slice(programme, heroEnd)).toContain(pill("nckh-ung-dung-ai-xuat-ban-quoc-te"));
    expect(html).not.toContain(pill("training-tieu-luan-nckh-kltn"));
    expect(html).not.toContain("/khoa-hoc/training-tieu-luan-nckh-kltn");
    expect(html).not.toContain("/khoa-hoc/stata-kinh-te-luong");
    expect(html).not.toContain("220.000 đ");

    // Phiên song song: kiểm tra AI & đạo văn với giá thấp nhất, trong hero.
    const parallel = html.slice(programme, heroEnd);
    expect(parallel).toContain('href="/kiem-tra-ai-dao-van"');
    expect(parallel).toContain("50K");

    // Thẻ đeo cố vấn trong hero.
    expect(html.slice(html.indexOf('id="top"'), heroEnd)).toContain("Cố vấn Học thuật Trưởng");

    // Teaser hội thảo quốc tế đứng ngay sau hero và trước About, link sang
    // trang chi tiết riêng — không kéo bảng/quy trình vào trang chủ.
    expect(html).toContain('id="hoi-thao-quoc-te"');
    expect(html).toContain('href="/hoi-thao-quoc-te"');
    expect(heroEnd).toBeLessThan(html.indexOf('id="hoi-thao-quoc-te"'));
    expect(html.indexOf('id="hoi-thao-quoc-te"')).toBeLessThan(html.indexOf('id="ve-chung-toi"'));

    expect(html).not.toContain("Đánh giá học viên");
    expect(html).not.toContain("Tuan Tran");
    // Danh mục công bố đầy đủ ở /cong-bo; trang chủ chỉ có tên tạp chí trên
    // dải chạy, không có tiêu đề bài báo.
    expect(html).not.toContain("Green Energy and Wage Inequality");
    // About mang bản đồ hội thảo thay cho ảnh minh họa cũ.
    expect(html).not.toContain("/images/successful-target");
    const about = html.slice(html.indexOf('id="ve-chung-toi"'));
    expect(about).toContain("data-map");
    expect(about).toContain("14 lần trình bày");
    expect(about).toContain("11 quốc gia");
    expect(html).toContain('id="faq"');
    expect(html).toContain("Khóa học và dịch vụ đồng hành nghiên cứu khác nhau thế nào?");
    expect(html).toContain("Humanizing &amp; Proofreading đã có bảng giá chưa?");
    expect(html.match(/<details/g)).toHaveLength(9);
    expect(html).not.toContain("zalo.me/g/");
    expect(html).not.toContain("drive.google.com/drive/folders/");
  });

  it("ẩn bảng khóa khi khóa đã hết chỗ, giữ phiên song song và teaser hội thảo", async () => {
    mocks.landingCourseData.mockResolvedValueOnce({
      summaries: {},
      reviews: {},
      availability: { "nckh-ung-dung-ai-xuat-ban-quoc-te": "full" },
      seatsLeft: { "nckh-ung-dung-ai-xuat-ban-quoc-te": 0 },
    });

    const html = renderToStaticMarkup(await Home());
    expect(html).not.toContain('id="khoa-hoc"');
    expect(html).not.toContain("Còn 0 chỗ");
    // Dịch vụ Turnitin không phụ thuộc khóa nào đang mở.
    expect(html).toContain('href="/kiem-tra-ai-dao-van"');
    expect(html).toContain('id="hoi-thao-quoc-te"');
  });

  it("không dựng số ghế giả khi database lỗi", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.landingCourseData.mockRejectedValueOnce(new Error("database offline"));

    const html = renderToStaticMarkup(await Home());
    expect(html).not.toContain('id="khoa-hoc"');
    expect(html).not.toMatch(/Còn \d+ chỗ/);
    consoleError.mockRestore();
  });

  it("dải chạy công bố nằm trong <section id=\"top\"> của hero, không thêm section", async () => {
    const html = renderToStaticMarkup(await Home());
    const hero = html.slice(
      html.indexOf('id="top"'),
      html.indexOf("</section>", html.indexOf('id="top"')),
    );

    expect(hero).toContain("data-marquee");
    expect(hero).toContain("Công bố &amp; trình bày tại");
    expect(hero).toContain("Economic Modelling");
    expect(hero).toContain("Deakin University");
    // Bản sao để lặp vòng bị ẩn khỏi trình đọc màn hình.
    expect(hero).toMatch(/<ul aria-hidden="true" data-marquee-copy="true"/);
    expect(html.match(/data-marquee(?![-\w])/g)).toHaveLength(1);
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

  /**
   * Trang chủ nằm trên một mặt giấy duy nhất (.impeccable/surfaces/app-page-tsx.md):
   * không còn nhịp nền so le trắng/xám; các section sau hero phân tách bằng
   * đường kẻ trên (`border-t`). Đúng ở cả hai trạng thái của bảng khóa.
   */
  it.each([
    ["có khóa đang mở", undefined],
    ["không khóa nào mở", { summaries: {}, reviews: {}, availability: {}, seatsLeft: {} }],
  ])("một mặt giấy, section phân tách bằng đường kẻ (%s)", async (_label, data) => {
    if (data) mocks.landingCourseData.mockResolvedValue(data);
    const html = renderToStaticMarkup(await Home());
    const surfaces = sectionSurfaces(html);

    expect(surfaces.length).toBeGreaterThan(4);
    expect(surfaces).not.toContain("soft");
    const ruled = [...html.matchAll(/<section[^>]*class="([^"]*)"/g)]
      .map(([, className]) => className)
      .filter((className) => /\bbg-bg\b/.test(className) && !className.includes("border-t"));
    // Chỉ hero (section đầu tiên) không có đường kẻ trên.
    expect(ruled).toHaveLength(1);
  });
});
