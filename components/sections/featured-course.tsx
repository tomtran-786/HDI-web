import { courses, coursesIntro } from "@/content/course";
import { publicAvailability, type PublicAvailability } from "@/lib/course-sales";
import {
  publishedReviews,
  publishedSummaries,
  type PublicReview,
  type ReviewSummary,
} from "@/lib/reviews";
import { CourseList } from "../course-list";
import { Reveal } from "../ui/reveal";
import { Section, SectionHeading } from "../ui/section";

/**
 * Đánh giá là thứ trang trí cho phần khóa học, không phải phần thân của nó.
 *
 * Trước đây trang chủ không chạm tới database một lần nào — giỏ hàng được nạp
 * bằng fetch từ trình duyệt, còn mọi thứ hiển thị đều đến từ content/. Truy vấn
 * này là lần đầu tiên trang bán hàng phụ thuộc vào Postgres, nên nó phải phụ
 * thuộc theo kiểu hỏng-cũng-không-sao: Supabase trục trặc thì mất dữ liệu xã
 * hội và thẻ chuyển sang trạng thái chưa mở, chứ không làm trắng trang giới thiệu.
 */
async function loadCourseData() {
  try {
    const [summaries, reviews, availability] = await Promise.all([
      publishedSummaries(),
      publishedReviews(),
      publicAvailability(),
    ]);
    return { summaries, reviews, availability };
  } catch (error) {
    console.error("[khoa-hoc] Không đọc được dữ liệu công khai:", error);
    return {
      summaries: {} as Record<string, ReviewSummary>,
      reviews: {} as Record<string, PublicReview[]>,
      availability: {} as Record<string, PublicAvailability>,
    };
  }
}

export async function FeaturedCourse() {
  const { summaries, reviews, availability } = await loadCourseData();

  return (
    <Section id="khoa-hoc">
      <SectionHeading
        eyebrow={coursesIntro.eyebrow}
        title={coursesIntro.title}
        subtitle={coursesIntro.subtitle}
      />

      <Reveal>
        <p className="mb-8 max-w-xl text-base leading-relaxed text-fg-muted sm:text-lg">
          {coursesIntro.intro}
        </p>
      </Reveal>

      {/* The sort control needs state, so the list is a client component and
          this section stays a server component. */}
      <CourseList
        courses={courses}
        summaries={summaries}
        reviews={reviews}
        availability={availability}
      />
    </Section>
  );
}
