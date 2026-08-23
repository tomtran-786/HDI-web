import { courses, coursesIntro } from "@/content/course";
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
 * thuộc theo kiểu hỏng-cũng-không-sao: Supabase trục trặc thì mất mấy ngôi sao,
 * chứ không mất cả trang giới thiệu và toàn bộ nút đăng ký trên đó.
 */
async function loadReviews() {
  try {
    const [summaries, reviews] = await Promise.all([
      publishedSummaries(),
      publishedReviews(),
    ]);
    return {
      summaries: Object.fromEntries(summaries) as Record<string, ReviewSummary>,
      reviews: Object.fromEntries(reviews) as Record<string, PublicReview[]>,
    };
  } catch (error) {
    console.error("[khoa-hoc] Không đọc được đánh giá:", error);
    return {
      summaries: {} as Record<string, ReviewSummary>,
      reviews: {} as Record<string, PublicReview[]>,
    };
  }
}

export async function FeaturedCourse() {
  const { summaries, reviews } = await loadReviews();

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
      <CourseList courses={courses} summaries={summaries} reviews={reviews} />
    </Section>
  );
}
