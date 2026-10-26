import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COURSE_SLUGS, courses } from "@/content/course";
import { courseVisibility } from "@/content/course-visibility";
import { nav, withoutHiddenCourses } from "@/content/navigation";
import { hiddenSlugs, isListed } from "@/lib/course-availability";

const mocks = vi.hoisted(() => ({ landingCourseData: vi.fn() }));

vi.mock("@/lib/course-sales", () => ({
  landingCourseData: mocks.landingCourseData,
}));
vi.mock("@/lib/analytics", () => ({
  trackCourseModal: vi.fn(),
  trackCourseQuickView: vi.fn(),
  trackCourseSort: vi.fn(),
  trackCta: vi.fn(),
}));
vi.mock("@/components/cart-provider", () => ({
  useCart: () => ({ openCart: vi.fn() }),
}));

import CoursesPage from "@/app/khoa-hoc/page";

const [open, full, closed, ...rest] = COURSE_SLUGS;

describe("isListed", () => {
  it("chỉ ẩn khi biết chắc khóa là not_open", () => {
    expect(isListed({ [open]: "buyable" }, open)).toBe(true);
    expect(isListed({ [full]: "full" }, full)).toBe(true);
    expect(isListed({ [closed]: "not_open" }, closed)).toBe(false);
  });

  it("khóa không có dòng trong DB cũng là chưa mở bán", () => {
    expect(isListed({ [open]: "buyable" }, closed)).toBe(false);
  });

  it("không đọc được dữ liệu thì hiện tất cả (fail-open)", () => {
    expect(isListed(null, closed)).toBe(true);
    expect(isListed(undefined, closed)).toBe(true);
    expect(hiddenSlugs(null, COURSE_SLUGS)).toEqual([]);
  });

  it("hiddenSlugs trả đúng các khóa not_open hoặc thiếu dòng", () => {
    const availability = {
      [open]: "buyable",
      [full]: "full",
      [closed]: "not_open",
    } as const;
    expect(hiddenSlugs(availability, COURSE_SLUGS)).toEqual([closed, ...rest]);
  });
});

describe("menu khóa học", () => {
  const khoaHoc = (items: ReturnType<typeof withoutHiddenCourses>) =>
    items.find((item) => item.href === "/khoa-hoc")!;
  const hrefs = (items: ReturnType<typeof withoutHiddenCourses>) =>
    khoaHoc(items).groups?.flatMap((group) => group.children.map((c) => c.href)) ?? [];

  it("không ẩn gì thì giữ nguyên menu", () => {
    expect(withoutHiddenCourses(nav, [])).toBe(nav);
  });

  it("bỏ khóa bị ẩn và nhóm hết khóa, các mục khác không đổi", () => {
    const visible = withoutHiddenCourses(nav, ["kinh-te-luong-stata-ai"]);

    expect(hrefs(visible)).not.toContain("/khoa-hoc/kinh-te-luong-stata-ai");
    expect(hrefs(visible)).toContain("/khoa-hoc/nckh-chuyen-sau-spss");
    expect(visible.find((item) => item.href === "/dich-vu")).toBe(
      nav.find((item) => item.href === "/dich-vu"),
    );

    const noFoundation = withoutHiddenCourses(nav, ["training-tieu-luan-nckh-kltn"]);
    expect(khoaHoc(noFoundation).groups?.map((group) => group.label)).not.toContain(
      "Nền tảng",
    );
  });

  it("ẩn hết thì mục Khóa học còn lại là link thường, không dropdown rỗng", () => {
    const visible = withoutHiddenCourses(nav, COURSE_SLUGS);
    expect(khoaHoc(visible).groups).toEqual([]);
    expect(khoaHoc(visible).href).toBe("/khoa-hoc");
  });

  it("nav gốc vẫn đủ bảy khóa để breadcrumb tra nhãn", () => {
    const all = nav
      .find((item) => item.href === "/khoa-hoc")!
      .groups!.flatMap((group) => group.children);
    expect(all).toHaveLength(7);
  });
});

describe("/khoa-hoc", () => {
  beforeEach(() => mocks.landingCourseData.mockReset());

  const render = async () => renderToStaticMarkup(await CoursesPage());
  const cardHrefs = (html: string) =>
    courses.filter((course) => html.includes(`href="/khoa-hoc/${course.slug}"`));

  it("chỉ hiện các khóa đã mở bán, giữ khóa hết chỗ", async () => {
    mocks.landingCourseData.mockResolvedValue({
      summaries: {},
      reviews: {},
      availability: { [open]: "buyable", [full]: "full", [closed]: "not_open" },
    });
    const html = await render();

    expect(cardHrefs(html).map((course) => course.slug)).toEqual([open, full]);
    expect(html).toContain("Đã hết chỗ");
    for (const slug of [closed, ...rest]) {
      expect(html).not.toContain(`/khoa-hoc/${slug}`);
    }
    expect(html).not.toContain(courseVisibility.listEmpty.title);
  });

  it("khối chứng nhận nằm sau danh sách khóa và trước thẻ tư vấn", async () => {
    mocks.landingCourseData.mockResolvedValue({
      summaries: {},
      reviews: {},
      availability: { [open]: "buyable", [full]: "full", [closed]: "not_open" },
    });
    const html = await render();

    const lastCard = html.indexOf(`href="/khoa-hoc/${full}"`);
    const certificate = html.indexOf('id="chung-nhan"');
    const consult = html.indexOf("Chưa chắc khóa học nào phù hợp với bạn?");
    expect(lastCard).toBeGreaterThan(-1);
    expect(certificate).toBeGreaterThan(lastCard);
    expect(consult).toBeGreaterThan(certificate);
  });

  it("không còn khóa nào thì hiện trạng thái trống kèm link tư vấn", async () => {
    mocks.landingCourseData.mockResolvedValue({
      summaries: {},
      reviews: {},
      availability: {},
    });
    const html = await render();

    expect(cardHrefs(html)).toEqual([]);
    expect(html).toContain(courseVisibility.listEmpty.title);
    expect(html).toContain('href="/#lien-he"');
    expect(html).not.toContain("Sắp xếp");
    expect(html).not.toContain('id="chung-nhan"');
  });

  it("không đọc được dữ liệu thì hiện đủ bảy khóa, không badge", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.landingCourseData.mockRejectedValueOnce(new Error("db offline"));
    const html = await render();

    expect(cardHrefs(html)).toHaveLength(7);
    expect(html).not.toContain("Chưa mở đăng ký");
    expect(html).toContain('id="chung-nhan"');
    consoleError.mockRestore();
  });
});
