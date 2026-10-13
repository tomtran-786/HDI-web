import type { Metadata } from "next";
import Image from "next/image";
import Script from "next/script";
import { notFound, redirect } from "next/navigation";
import { CourseCard } from "@/components/course-card";
import { CourseEnroll } from "@/components/course-enroll";
import { CourseFactList } from "@/components/course-facts";
import { CourseRoadmap } from "@/components/course-roadmap";
import { CourseStickyBar } from "@/components/course-sticky-bar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EnrolledPill } from "@/components/ui/enrolled-pill";
import { CheckDot } from "@/components/ui/check-dot";
import { IconArrow } from "@/components/ui/icons";
import { PriceTag } from "@/components/ui/price-tag";
import { Reveal } from "@/components/ui/reveal";
import { Section, SectionHeading } from "@/components/ui/section";
import { CourseCover } from "@/components/course-cover";
import { Stars } from "@/components/ui/stars";
import { cartModal } from "@/content/checkout";
import { COURSE_SLUGS, courses, type Course } from "@/content/course";
import { site } from "@/content/site";
import { cardPresentation } from "@/lib/course-availability";
import { landingCourseData } from "@/lib/course-sales";
import { formatDate } from "@/lib/format";
import type { PublicReview, ReviewSummary } from "@/lib/reviews";
import { structuredDataForCourse } from "@/lib/structured-data";

/*
 * BỐ CỤC — theo cách theanalystacademy.com phân bổ thông tin trên trang khóa
 * học (bản cào và ảnh chụp ở reference/theanalystacademy/, script
 * reference/scrape_theanalystacademy.py):
 *
 *   1. Đầu trang: tên khóa + đánh giá, rồi hai cột — ảnh bìa bên trái, card
 *      "khóa học gồm những gì + học phí + nút đăng ký" bên phải. Mọi thứ cần để
 *      quyết định mua nằm trong màn hình đầu.
 *   2. "Giới thiệu khóa học": đoạn giới thiệu và lưới kết quả đạt được — bản
 *      của "What You Will Learn".
 *   3. "Dành cho ai".
 *   4. "Lộ trình học": module gập được bên trái, giảng viên bên phải — bản của
 *      "Your Course Outline" + "About the Instructor".
 *   5. Đánh giá học viên, rồi "Khóa học khác" — cùng thẻ CourseCard với trang
 *      chủ và /khoa-hoc, bấm vào mở modal xem nhanh.
 *
 * Bảng "Thông tin khóa học" riêng ở cuối trang đã bỏ: sáu dòng `facts` và học
 * phí giờ nằm trong card đầu trang, chỗ người đọc cần chúng khi bấm đăng ký.
 * Thanh học phí cố định ở đáy (CourseStickyBar) giữ nút đăng ký trong tầm tay
 * sau khi card đó cuộn qua.
 */

type CoursePageProps = { params: Promise<{ slug: string }> };

const LEGACY_STATA_SLUG = "stata-kinh-te-luong";
const MERGED_SPSS_SLUG = "nckh-chuyen-sau-spss";

/** Id của card học phí — thanh cố định ở đáy chỉ hiện khi card này đã cuộn qua. */
const PRICE_CARD_ID = "hoc-phi";
const ROADMAP_ID = "lo-trinh";

function redirectLegacyCourse(slug: string): void {
  if (slug === LEGACY_STATA_SLUG) redirect(`/khoa-hoc/${MERGED_SPSS_SLUG}`);
}

function courseForSlug(slug: string): Course | undefined {
  return courses.find((course) => course.slug === slug);
}

export function generateStaticParams() {
  return COURSE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  redirectLegacyCourse(slug);
  const course = courseForSlug(slug);
  if (!course) notFound();

  return {
    title: `${course.title} — ${site.name}`,
    description: course.intro,
    alternates: { canonical: `/khoa-hoc/${course.slug}` },
  };
}

async function loadCourseData() {
  try {
    return await landingCourseData();
  } catch (error) {
    console.error("[khoa-hoc-detail] Không đọc được dữ liệu công khai:", error);
    return {
      summaries: {} as Record<string, ReviewSummary>,
      reviews: {} as Record<string, PublicReview[]>,
      availability: null,
    };
  }
}

function StructuredData({ course }: { course: Course }) {
  const data = structuredDataForCourse(course);

  return (
    <Script
      id={`course-structured-data-${course.slug}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export default async function CourseDetailPage({ params }: CoursePageProps) {
  const { slug } = await params;
  redirectLegacyCourse(slug);
  const course = courseForSlug(slug);
  if (!course) notFound();

  const { summaries, reviews, availability } = await loadCourseData();
  const summary = summaries[course.slug];
  const publishedReviews = reviews[course.slug] ?? [];
  const publicAvailability = availability
    ? (availability[course.slug] ?? "not_open")
    : undefined;
  const { badge } = cardPresentation(publicAvailability);
  const availabilityTone =
    badge === "buyable" ? "success" : badge === "full" ? "danger" : "cool";
  const related = courses.filter((item) => item.slug !== course.slug).slice(0, 3);
  const { instructor } = course;

  return (
    <>
      <StructuredData course={course} />

      <section className="border-b border-line bg-bg">
        <div className="shell py-8 sm:py-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="inline-flex items-center rounded-md bg-tint px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                  Mã khóa {course.code}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-fg-muted">
                  {course.eyebrow}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-primary sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
                {course.title}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-fg-muted sm:text-lg">
                {course.audience}
              </p>
            </div>
            {summary && (
              <div className="flex flex-col items-center gap-1.5 rounded-card bg-tint px-6 py-4 text-center">
                <Stars value={summary.average} size={17} />
                <p className="text-sm font-bold text-fg">
                  Đánh giá {summary.average.toFixed(1)}/5
                </p>
                <p className="text-xs text-fg-muted">{summary.count} đánh giá</p>
              </div>
            )}
          </div>

          <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
            <div>
              <CourseCover
                cover={course.cover}
                variant="hero"
                sizes="(min-width: 1024px) 50rem, 100vw"
                eager
              />
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                {instructor && (
                  <div className="flex items-center gap-3">
                    <Image
                      src={instructor.portrait.src}
                      alt=""
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-full object-cover"
                    />
                    <p className="text-sm leading-snug text-fg-muted">
                      Giảng viên
                      <br />
                      <span className="font-bold text-fg">
                        {instructor.credential} {instructor.name}
                      </span>
                    </p>
                  </div>
                )}
                <EnrolledPill slug={course.slug} />
              </div>
            </div>

            <Card id={PRICE_CARD_ID} className="p-6 sm:p-7" hover={false}>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                Khóa học gồm
              </p>
              <CourseFactList course={course} className="mt-4" />

              <div className="mt-5 border-t border-line pt-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                    Học phí
                  </p>
                  {badge && (
                    <Badge tone={availabilityTone}>
                      {cartModal.availability[badge]}
                    </Badge>
                  )}
                </div>
                <div className="mt-2">
                  <PriceTag price={course.price} />
                </div>
                <p className="mt-2 text-sm font-semibold text-success">
                  {course.price.note}
                </p>
                <CourseEnroll
                  course={course}
                  availability={publicAvailability}
                  className="mt-5"
                  stacked
                />
                <p className="mt-3 text-center text-xs leading-relaxed text-fg-subtle">
                  {course.registerNote}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <Section>
        <SectionHeading eyebrow="Tổng quan" title="Giới thiệu khóa học" />
        <Reveal>
          <Card className="p-6 sm:p-8" hover={false}>
            <p className="max-w-4xl text-base leading-relaxed text-fg sm:text-lg">
              {course.intro}
            </p>
            <h3 className="mt-8 text-lg font-bold text-primary">
              Sau khóa học, bạn có thể
            </h3>
            <ul className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              {course.outcomes.map((outcome) => (
                <li
                  key={outcome}
                  className="flex gap-3 text-[15px] leading-relaxed text-fg-muted"
                >
                  <CheckDot />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      </Section>

      <Section soft>
        <SectionHeading eyebrow="Đối tượng học viên" title="Dành cho ai" />
        <Reveal>
          {course.audienceProfiles ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {course.audienceProfiles.map((profile) => (
                <Card key={profile.name} className="p-6" hover={false}>
                  <h3 className="text-base font-bold text-fg">{profile.name}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">
                    {profile.detail}
                  </p>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="max-w-3xl p-6 sm:p-8" hover={false}>
              <p className="text-base leading-relaxed text-fg-muted sm:text-lg">
                {course.audience}
              </p>
            </Card>
          )}
        </Reveal>
      </Section>

      <Section id={ROADMAP_ID}>
        <SectionHeading eyebrow="Nội dung đào tạo" title="Lộ trình học" />
        <div
          className={
            instructor
              ? "grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-10"
              : ""
          }
        >
          <Reveal>
            <CourseRoadmap course={course} />
          </Reveal>

          {instructor && (
            <Reveal className="lg:sticky lg:top-24">
              <Card className="p-6" hover={false}>
                <h3 className="text-lg font-bold text-primary">Giảng viên</h3>
                <div className="mt-4 flex items-center gap-4">
                  <Image
                    src={instructor.portrait.src}
                    alt={instructor.portrait.alt}
                    width={80}
                    height={80}
                    className="h-20 w-20 shrink-0 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-lg font-bold leading-snug text-fg">
                      {instructor.credential} {instructor.name}
                    </p>
                    <p className="mt-0.5 text-sm text-fg-muted">
                      Giảng viên chính
                    </p>
                  </div>
                </div>
                <ul className="mt-5 space-y-3">
                  {instructor.highlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="flex gap-3 text-sm leading-relaxed text-fg-muted"
                    >
                      <CheckDot />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5">
                  {instructor.links.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
                    >
                      {item.label}
                      <IconArrow size={14} />
                    </a>
                  ))}
                </div>
              </Card>
            </Reveal>
          )}
        </div>
      </Section>

      {publishedReviews.length > 0 && (
        <Section soft>
          <SectionHeading eyebrow="Người học chia sẻ" title="Đánh giá học viên" />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {publishedReviews.map((review, index) => (
              <Reveal key={review.id} delay={index * 60} className="h-full">
                <Card className="flex h-full flex-col p-6" hover={false}>
                  <Stars value={review.rating} size={15} />
                  {review.comment && (
                    <p className="mt-3 text-[15px] font-semibold leading-relaxed text-fg">
                      “{review.comment}”
                    </p>
                  )}
                  <div className="mt-auto flex flex-wrap items-baseline justify-between gap-2 pt-5">
                    <span className="text-sm font-bold text-primary">
                      {review.author}
                    </span>
                    <span className="text-xs text-fg-subtle">
                      {formatDate(new Date(review.createdAt))}
                    </span>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      <Section soft={publishedReviews.length === 0}>
        <SectionHeading eyebrow="Tiếp tục phát triển" title="Khóa học khác" />
        <div className="grid gap-5 md:grid-cols-3">
          {related.map((item, index) => (
            <Reveal key={item.slug} delay={index * 60} className="h-full">
              <CourseCard
                course={item}
                summary={summaries[item.slug]}
                availability={
                  availability ? (availability[item.slug] ?? "not_open") : undefined
                }
                sizes="(min-width: 768px) 24rem, 100vw"
              />
            </Reveal>
          ))}
        </div>
      </Section>

      <CourseStickyBar
        course={course}
        availability={publicAvailability}
        watchId={PRICE_CARD_ID}
        outlineHref={`#${ROADMAP_ID}`}
      />
    </>
  );
}
