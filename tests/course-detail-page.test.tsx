import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COURSE_SLUGS, courses } from "@/content/course";
import { structuredDataForCourse } from "@/lib/structured-data";

class NotFoundSignal extends Error {}
class RedirectSignal extends Error {}

const mocks = vi.hoisted(() => ({
  landingCourseData: vi.fn(),
  notFound: vi.fn(),
  redirect: vi.fn(),
  openCart: vi.fn(),
}));

vi.mock("@/lib/course-sales", () => ({
  landingCourseData: mocks.landingCourseData,
}));
vi.mock("@/lib/analytics", () => ({
  trackCourseModal: vi.fn(),
  trackCta: vi.fn(),
}));
vi.mock("@/components/cart-provider", () => ({
  useCart: () => ({ openCart: mocks.openCart }),
}));
vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  redirect: mocks.redirect,
}));

import CourseDetailPage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/khoa-hoc/[slug]/page";

const reviewedSlug = "viet-bao-cao-khoa-hoc";

beforeEach(() => {
  mocks.notFound.mockImplementation(() => {
    throw new NotFoundSignal();
  });
  mocks.redirect.mockImplementation((path: string) => {
    throw new RedirectSignal(path);
  });
  mocks.landingCourseData.mockResolvedValue({
    summaries: {
      [reviewedSlug]: { average: 4.8, count: 12 },
    },
    reviews: {
      [reviewedSlug]: [
        {
          id: "review-1",
          rating: 5,
          comment: "Lộ trình rõ ràng và áp dụng được ngay.",
          createdAt: Date.UTC(2026, 7, 20),
          author: "Học viên HDI",
        },
      ],
    },
    availability: Object.fromEntries(
      COURSE_SLUGS.map((slug) => [slug, "buyable"]),
    ),
  });
});

describe("trang chi tiết khóa học", () => {
  it("tạo sẵn đúng tám route khóa học", () => {
    expect(generateStaticParams()).toEqual(COURSE_SLUGS.map((slug) => ({ slug })));
  });

  it("render khóa AI mới với nội dung, ngày khai giảng và giảng viên đã chốt", async () => {
    const course = courses[0];
    const html = renderToStaticMarkup(
      await CourseDetailPage({
        params: Promise.resolve({ slug: course.slug }),
      }),
    );

    expect(course.slug).toBe("nckh-ung-dung-ai-xuat-ban-quoc-te");
    expect(html).toContain("Nghiên cứu khoa học ứng dụng AI &amp; xuất bản quốc tế");
    expect(html).toContain("07/09/2026");
    // Chủ khóa yêu cầu chưa công bố lịch theo thứ cho tới khi có thời khóa biểu
    // chi tiết (xem ghi chú D ở đầu content/course.ts). Dòng "Lịch học" mang cả
    // ngày khai giảng lẫn lời hẹn, nên khẳng định phần lời hẹn thay vì cả câu:
    // gộp hai ý vào một dòng là chuyện trình bày, còn "chưa có lịch theo thứ"
    // mới là điều test này canh.
    expect(html).toContain("lịch chi tiết sẽ được thông báo");
    expect(html).not.toContain("Thứ Bảy");
    expect(html).not.toContain("Chủ Nhật");
    expect(html).toContain("Tiến sĩ Trịnh Công Tâm");
    expect(html).toContain("System GMM");
    expect(html).not.toContain("học viên đã đăng ký");
  });

  it("render đủ các block theo đúng thứ tự và chỉ dùng dữ liệu thật", async () => {
    const course = courses.find((item) => item.slug === reviewedSlug)!;
    const html = renderToStaticMarkup(
      await CourseDetailPage({
        params: Promise.resolve({ slug: course.slug }),
      }),
    );

    expect(html).toContain(course.title.replace("&", "&amp;"));
    expect(html).toContain(course.price.amount);
    expect(html).toContain("Lộ trình rõ ràng và áp dụng được ngay.");
    expect(html).not.toContain("←");
    expect(structuredDataForCourse(course)).toMatchObject([
      {
        "@type": "Course",
        name: course.title,
        offers: { price: course.price.vnd, priceCurrency: "VND" },
      },
      { "@type": "BreadcrumbList" },
    ]);

    const headings = [
      "Giới thiệu khóa học",
      "Dành cho ai",
      "Lộ trình học",
      "Sau khóa học",
      "Thông tin khóa học",
      "Đánh giá học viên",
      "Khóa học khác",
    ];
    const positions = headings.map((heading) => html.indexOf(heading));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(html.match(/Đăng ký học khóa này/g)).toHaveLength(1);
    expect(html.match(/Nhắn Zalo/g)).toHaveLength(1);
  });

  it("đánh số buổi liên tục cho curriculum dạng sessions", async () => {
    const course = courses.find((item) => item.slug === reviewedSlug)!;
    const total = course.phases.reduce(
      (sum, phase) => sum + phase.sessions.length,
      0,
    );
    const html = renderToStaticMarkup(
      await CourseDetailPage({
        params: Promise.resolve({ slug: course.slug }),
      }),
    );

    expect(html).toContain("Buổi 1:");
    expect(html).toContain(`Buổi ${total}:`);
  });

  it("render đủ sáu module cho khóa SPSS & Stata và ẩn đánh giá khi chưa có review", async () => {
    const course = courses.find((item) => item.slug === "nckh-chuyen-sau-spss")!;
    const html = renderToStaticMarkup(
      await CourseDetailPage({
        params: Promise.resolve({ slug: course.slug }),
      }),
    );

    // Khóa này đánh số theo module (1.1 … 6.11), không phải "Buổi n" — giáo
    // trình gốc chia hai tầng và đánh số đúng như vậy.
    expect(html).toContain("1.1");
    expect(html).toContain("Từ vấn đề thực tiễn đến câu hỏi và mục tiêu nghiên cứu");
    expect(html).toContain("6.10");
    expect(html).toContain("Đề xuất hướng phát triển và lập kế hoạch triển khai tiếp theo");
    // Danh mục tài liệu gửi trước buổi tư vấn là mục cuối của Module 6, kèm ý con.
    expect(html).toContain("Tài liệu học viên gửi trước Module 6");
    expect(html).toContain("Tối đa ba vấn đề cần giảng viên tư vấn");
    expect(html).not.toContain("Buổi 1:");
    expect(html).not.toContain("Kho record");
    expect(html).not.toContain("Đánh giá học viên");
  });

  /**
   * Cách trình bày giá ưu đãi là một quyết định marketing đã chốt: con số sau
   * giảm phải to hơn giá gốc, giá gốc phải gạch ngang và điều kiện phải đứng
   * cạnh con số lớn — nếu không, người mua lẻ tới bước thanh toán mới biết mình
   * trả một mức giá khác.
   */
  it("đưa giá ưu đãi lên trước giá gốc gạch ngang, kèm điều kiện", async () => {
    const course = courses.find(
      (item) => item.slug === "training-tieu-luan-nckh-kltn",
    )!;
    const deal = course.price.deal!;
    const html = renderToStaticMarkup(
      await CourseDetailPage({
        params: Promise.resolve({ slug: course.slug }),
      }),
    );

    expect(html).toContain(deal.amount);
    expect(html).toContain(course.price.amount);
    expect(html).toContain(deal.condition);
    // Giá gốc nằm trong <s>, giá ưu đãi thì không. `<s\b` chứ không phải `<s[^>]*`
    // vì cái sau khớp luôn cả <section>, và test khi đó luôn xanh.
    const struck = html.match(/<s\b[^>]*>.*?<\/s>/g) ?? [];
    expect(struck.some((tag) => tag.includes(course.price.amount))).toBe(true);
    expect(struck.some((tag) => tag.includes(deal.amount))).toBe(false);
    expect(struck.every((tag) => tag.includes("line-through"))).toBe(true);
    // Con số ưu đãi xuất hiện trước con số gốc trong khối học phí.
    expect(html.indexOf(deal.amount)).toBeLessThan(html.indexOf(course.price.amount));
    // Nhưng schema.org vẫn quảng cáo đúng giá sẽ bị trừ tiền.
    expect(structuredDataForCourse(course)[0]).toMatchObject({
      offers: { price: course.price.vnd },
    });
  });

  it("render nhóm đối tượng và hai tầng lộ trình của khóa nền tảng", async () => {
    const course = courses.find(
      (item) => item.slug === "training-tieu-luan-nckh-kltn",
    )!;
    const html = renderToStaticMarkup(
      await CourseDetailPage({
        params: Promise.resolve({ slug: course.slug }),
      }),
    );

    for (const profile of course.audienceProfiles!) {
      expect(html).toContain(profile.name);
    }
    // Ý con của mục 1.1 và câu chốt của module đều phải ra tới HTML.
    expect(html).toContain("Đọc đề bài, rubric và xác định yêu cầu trọng tâm");
    expect(html).toContain("Sau Module 1:");
    expect(html).toContain("Nguyên tắc Human → AI → Verify → Rewrite");
  });

  it("fail-open khi dữ liệu công khai tạm thời không đọc được", async () => {
    mocks.landingCourseData.mockRejectedValueOnce(new Error("database offline"));
    const course = courses[0];
    const html = renderToStaticMarkup(
      await CourseDetailPage({
        params: Promise.resolve({ slug: course.slug }),
      }),
    );

    expect(html).toContain(course.title.replace("&", "&amp;"));
    expect(html).toContain("Đăng ký học khóa này");
    expect(html).not.toContain("Chưa mở đăng ký");
  });

  it("không render nút đăng ký chết khi khóa chưa mở", async () => {
    const course = courses.find((item) => item.slug === "nckh-chuyen-sau-spss")!;
    mocks.landingCourseData.mockResolvedValueOnce({
      summaries: {},
      reviews: {},
      availability: { [course.slug]: "not_open" },
    });

    const html = renderToStaticMarkup(
      await CourseDetailPage({
        params: Promise.resolve({ slug: course.slug }),
      }),
    );

    expect(html).toContain("Chưa mở đăng ký");
    expect(html).not.toContain("Đăng ký học khóa này");
    expect(html).toContain("Nhắn Zalo");
  });

  it("redirect URL Stata cũ về khóa SPSS & Stata ở page và metadata", async () => {
    await expect(
      CourseDetailPage({
        params: Promise.resolve({ slug: "stata-kinh-te-luong" }),
      }),
    ).rejects.toBeInstanceOf(RedirectSignal);

    await expect(
      generateMetadata({
        params: Promise.resolve({ slug: "stata-kinh-te-luong" }),
      }),
    ).rejects.toBeInstanceOf(RedirectSignal);

    expect(mocks.redirect).toHaveBeenCalledWith(
      "/khoa-hoc/nckh-chuyen-sau-spss",
    );
    expect(mocks.landingCourseData).not.toHaveBeenCalled();
  });

  it("trả 404 cho slug lạ trước khi truy vấn dữ liệu", async () => {
    await expect(
      CourseDetailPage({
        params: Promise.resolve({ slug: "khong-ton-tai" }),
      }),
    ).rejects.toBeInstanceOf(NotFoundSignal);
    expect(mocks.notFound).toHaveBeenCalledOnce();
    expect(mocks.landingCourseData).not.toHaveBeenCalled();
  });
});
