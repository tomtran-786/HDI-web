import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COURSE_SLUGS, courses } from "@/content/course";
import { enrolledCount, enrolledLabel } from "@/content/course-hype";
import { formatCount } from "@/lib/format";
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
  trackCourseQuickView: vi.fn(),
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

/** Văn bản thấy được của trang: tiêu đề có nét vẽ tay bị tách bởi <span>. */
const plainText = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&");

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
  it("tạo sẵn đúng bảy route khóa học", () => {
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
    expect(plainText(html)).toContain(
      "Nghiên cứu khoa học ứng dụng AI & xuất bản quốc tế",
    );
    expect(html).toContain("01/12/2026");
    // Thời khóa biểu chi tiết đã chốt (xem ghi chú D ở đầu content/course.ts):
    // sáu buổi thứ Ba và thứ Bảy, 01/12 – 19/12/2026, 19:00 – 21:00. Dòng
    // "Lịch học" mang đúng câu đó.
    expect(html).toContain("Thứ Ba và thứ Bảy hằng tuần, 01/12 – 19/12/2026");
    expect(html).not.toContain("Chủ Nhật");
    expect(html).toContain("Tiến sĩ Trịnh Công Tâm");
    expect(html).toContain("System GMM");
    // Số marketing giờ có cho mọi khóa, nên badge "học viên đã đăng ký" cũng
    // xuất hiện ở khóa AI mới này (xem content/course-hype.ts).
    expect(html).toContain("học viên đã đăng ký");
  });

  it("thẻ \"Khóa học khác\" cũng hiện số học viên đã đăng ký của từng khóa", async () => {
    const course = courses[0];
    const html = renderToStaticMarkup(
      await CourseDetailPage({
        params: Promise.resolve({ slug: course.slug }),
      }),
    );

    // Hero và sidebar đã có số của chính khóa này; chỉ xét phần sau tiêu đề
    // "Khóa học khác" để biết các thẻ liên quan có tự mang số của mình.
    const related = html.slice(html.lastIndexOf("Khóa học khác"));
    const others = courses
      .filter((item) => item.slug !== course.slug)
      .slice(0, 3);

    expect(others).toHaveLength(3);
    for (const item of others) {
      expect(related).toContain(
        `>${formatCount(enrolledCount[item.slug])}</span> ${enrolledLabel}`,
      );
    }
  });

  it("render đủ các block theo đúng thứ tự và chỉ dùng dữ liệu thật", async () => {
    const course = courses.find((item) => item.slug === reviewedSlug)!;
    const html = renderToStaticMarkup(
      await CourseDetailPage({
        params: Promise.resolve({ slug: course.slug }),
      }),
    );

    expect(plainText(html)).toContain(course.title);
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

    // Bố cục theo theanalystacademy.com (xem chú thích BỐ CỤC trong page.tsx):
    // học phí và sáu dòng `facts` nằm trong card đầu trang, kết quả đạt được
    // đi cùng phần giới thiệu, và không còn bảng "Thông tin khóa học" riêng.
    const headings = [
      "Khóa học gồm",
      "Học phí",
      "Giới thiệu khóa học",
      "Sau khóa học, bạn có thể",
      "Dành cho ai",
      "Lộ trình học",
      "Đánh giá học viên",
      "Hoàn thành khóa học, nhận giấy chứng nhận",
      "Đưa nghiên cứu của bạn từ mơ hồ đến bài bản",
      "Khóa học khác",
    ];
    const text = plainText(html);
    const positions = headings.map((heading) => text.indexOf(heading));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(html).not.toContain("Thông tin khóa học");
    for (const fact of course.facts) {
      expect(text.indexOf(fact.value)).toBeLessThan(text.indexOf("Giới thiệu khóa học"));
    }
    // Thanh học phí cố định chỉ mount sau khi cuộn qua card học phí, nên HTML
    // tĩnh vẫn chỉ có một nút đăng ký.
    expect(html.match(/Đăng ký học khóa này/g)).toHaveLength(1);
    expect(html).not.toContain("course-bar-in");
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

  it("render đủ năm buổi cho khóa SPSS và ẩn đánh giá khi chưa có review", async () => {
    const course = courses.find((item) => item.slug === "nckh-chuyen-sau-spss")!;
    const html = renderToStaticMarkup(
      await CourseDetailPage({
        params: Promise.resolve({ slug: course.slug }),
      }),
    );

    // Khóa này đánh số theo module (1.1 … 5.10), mỗi module là một buổi, nên
    // chủ đề đánh số hai tầng chứ không phải "Buổi n".
    expect(html).toContain("1.1");
    expect(html).toContain("Từ vấn đề thực tiễn đến câu hỏi và mục tiêu nghiên cứu");
    expect(html).toContain("5.10");
    expect(html).not.toContain("6.1");
    expect(html).toContain("Đề xuất hướng phát triển và lập kế hoạch triển khai tiếp theo");
    // Danh mục tài liệu gửi trước buổi tư vấn là mục cuối của Buổi 5, kèm ý con.
    expect(html).toContain("Tài liệu học viên gửi trước Buổi 5");
    expect(html).toContain("Tối đa ba vấn đề cần giảng viên tư vấn");
    expect(html).not.toContain("Buổi 1:");
    expect(html).not.toContain("Kho record");
    expect(plainText(html)).not.toContain("Đánh giá học viên");
    // Không có đánh giá thì khối chứng nhận và band cuối vẫn có mặt.
    expect(plainText(html)).toContain("Hoàn thành khóa học, nhận giấy chứng nhận");
    expect(html).toContain("Điều bạn nhận được");
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

  it("`titleMark` của cả bảy khóa là chuỗi con nguyên văn của title", () => {
    expect(courses).toHaveLength(7);
    for (const course of courses) {
      expect(course.titleMark.length).toBeGreaterThan(0);
      expect(course.title).toContain(course.titleMark);
    }
  });

  it("h1 gạch chân đúng cụm `titleMark` mà vẫn giữ nguyên chữ của title", async () => {
    const course = courses.find(
      (item) => item.slug === "training-tieu-luan-nckh-kltn",
    )!;
    const html = renderToStaticMarkup(
      await CourseDetailPage({
        params: Promise.resolve({ slug: course.slug }),
      }),
    );
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)![1];

    expect(h1).toContain(
      `<span data-notation="underline" class="">${course.titleMark}</span>`,
    );
    expect(plainText(h1)).toBe(course.title);
  });

  it("band \"Điều bạn nhận được\" nối về #hoc-phi và hiện ba kết quả đầu của khóa", async () => {
    const course = courses.find((item) => item.slug === reviewedSlug)!;
    const html = renderToStaticMarkup(
      await CourseDetailPage({
        params: Promise.resolve({ slug: course.slug }),
      }),
    );
    const band = html.slice(html.indexOf("Điều bạn nhận được"));

    expect(band).toContain('href="#hoc-phi"');
    expect(band).toContain("Giữ chỗ khóa này");
    for (const outcome of course.outcomes.slice(0, 3)) {
      expect(band).toContain(outcome);
    }
    // Chữ của nút đăng ký thật vẫn chỉ xuất hiện đúng một lần trên trang.
    expect(html.match(/Đăng ký học khóa này/g)).toHaveLength(1);
  });

  it("khóa chưa mở thì nút ở band đổi nhãn thay vì mời giữ chỗ", async () => {
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

    expect(html).toContain("Xem học phí và lịch học");
    expect(html).not.toContain("Giữ chỗ khóa này");
  });

  it("đánh giá nằm trên band navy, thẻ trắng cố định, và đứng trước chứng nhận", async () => {
    const course = courses.find((item) => item.slug === reviewedSlug)!;
    const html = renderToStaticMarkup(
      await CourseDetailPage({
        params: Promise.resolve({ slug: course.slug }),
      }),
    );
    const reviewBand = html.slice(
      html.lastIndexOf("<section", html.indexOf("Người học chia sẻ")),
      html.indexOf('id="chung-nhan"'),
    );

    expect(reviewBand).toMatch(/^<section[^>]*class="band /);
    expect(reviewBand).toContain("on-white");
    expect(html.indexOf("Người học chia sẻ")).toBeLessThan(
      html.indexOf('id="chung-nhan"'),
    );
  });

  it("fail-open khi dữ liệu công khai tạm thời không đọc được", async () => {
    mocks.landingCourseData.mockRejectedValueOnce(new Error("database offline"));
    const course = courses[0];
    const html = renderToStaticMarkup(
      await CourseDetailPage({
        params: Promise.resolve({ slug: course.slug }),
      }),
    );

    expect(plainText(html)).toContain(course.title);
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

  it.each(["stata-kinh-te-luong", "spss-smartpls-ai"])(
    "redirect URL cũ %s về khóa SPSS ở page và metadata",
    async (slug) => {
      await expect(
        CourseDetailPage({ params: Promise.resolve({ slug }) }),
      ).rejects.toBeInstanceOf(RedirectSignal);

      await expect(
        generateMetadata({ params: Promise.resolve({ slug }) }),
      ).rejects.toBeInstanceOf(RedirectSignal);

      expect(mocks.redirect).toHaveBeenCalledWith(
        "/khoa-hoc/nckh-chuyen-sau-spss",
      );
      expect(mocks.landingCourseData).not.toHaveBeenCalled();
    },
  );

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
