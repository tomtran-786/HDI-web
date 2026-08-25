import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COURSE_SLUGS, courses } from "@/content/course";
import { structuredDataForCourse } from "@/lib/structured-data";

class NotFoundSignal extends Error {}

const mocks = vi.hoisted(() => ({
  landingCourseData: vi.fn(),
  notFound: vi.fn(),
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
}));

import CourseDetailPage, { generateStaticParams } from "@/app/khoa-hoc/[slug]/page";

const reviewedSlug = "viet-bao-cao-khoa-hoc";

beforeEach(() => {
  mocks.notFound.mockImplementation(() => {
    throw new NotFoundSignal();
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
    expect(html).toContain("NGHIÊN CỨU KHOA HỌC ỨNG DỤNG AI &amp; XUẤT BẢN QUỐC TẾ");
    expect(html).toContain("07/09/2026");
    expect(html).toContain("Lịch chi tiết sẽ được thông báo");
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

  it("đánh số hai phần và ẩn đánh giá khi khóa chưa có review đã duyệt", async () => {
    const course = courses.find((item) => item.slug === "nckh-chuyen-sau-spss")!;
    const html = renderToStaticMarkup(
      await CourseDetailPage({
        params: Promise.resolve({ slug: course.slug }),
      }),
    );

    expect(html).toContain(">1.1<");
    expect(html).not.toContain("Đánh giá học viên");
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
    const course = courses.find((item) => item.slug === "stata-kinh-te-luong")!;
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
