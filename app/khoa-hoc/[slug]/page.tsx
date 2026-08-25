import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import { CourseEnroll } from "@/components/course-enroll";
import { CourseRoadmap } from "@/components/course-roadmap";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EnrolledPill } from "@/components/ui/enrolled-pill";
import { IconArrow, IconCheck } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { Section, SectionHeading } from "@/components/ui/section";
import { Stars } from "@/components/ui/stars";
import { cartModal } from "@/content/checkout";
import {
  COURSE_SLUGS,
  courses,
  type Course,
} from "@/content/course";
import { enrolledCount } from "@/content/course-hype";
import { site } from "@/content/site";
import { cardPresentation } from "@/lib/course-availability";
import { landingCourseData } from "@/lib/course-sales";
import { formatCount, formatDate } from "@/lib/format";
import type { PublicReview, ReviewSummary } from "@/lib/reviews";
import { structuredDataForCourse } from "@/lib/structured-data";

type CoursePageProps = { params: Promise<{ slug: string }> };

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
  const course = courseForSlug(slug);
  if (!course) notFound();

  const { summaries, reviews, availability } = await loadCourseData();
  const summary = summaries[course.slug];
  const marketingEnrollmentCount = enrolledCount[course.slug];
  const publishedReviews = reviews[course.slug] ?? [];
  const publicAvailability = availability
    ? (availability[course.slug] ?? "not_open")
    : undefined;
  const { badge } = cardPresentation(publicAvailability);
  const availabilityTone =
    badge === "buyable" ? "success" : badge === "full" ? "danger" : "cool";
  const related = courses.filter((item) => item.slug !== course.slug).slice(0, 3);

  return (
    <>
      <StructuredData course={course} />

      <section className="border-b border-line bg-bg">
        <div className="shell py-14 sm:py-16 lg:py-20">
          <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
                Mã khóa {course.code} · {course.eyebrow}
              </p>
              <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-primary sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
                {course.title}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-fg-muted sm:text-lg">
                {course.audience}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                {summary && (
                  <span className="inline-flex items-center gap-2">
                    <Stars value={summary.average} />
                    <span className="text-sm font-semibold text-fg-muted">
                      {summary.average.toFixed(1)} · {summary.count} đánh giá
                    </span>
                  </span>
                )}
                <EnrolledPill slug={course.slug} />
              </div>
            </div>

            <Card className="p-6 sm:p-7" hover={false}>
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
              <p className="mt-2 text-3xl font-bold tracking-tight text-primary">
                {course.price.amount}
              </p>
              <p className="mt-2 text-sm font-semibold text-success">
                {course.price.note}
              </p>
              <CourseEnroll
                course={course}
                availability={publicAvailability}
                className="mt-6"
              />
              <p className="mt-3 text-center text-xs leading-relaxed text-fg-subtle">
                {course.registerNote}
              </p>
            </Card>
          </div>
        </div>
      </section>

      <Section>
        <SectionHeading eyebrow="Tổng quan" title="Giới thiệu khóa học" />
        <Reveal>
          <p className="max-w-3xl text-base leading-relaxed text-fg-muted sm:text-lg">
            {course.intro}
          </p>
        </Reveal>
      </Section>

      <Section soft>
        <SectionHeading eyebrow="Đối tượng học viên" title="Dành cho ai" />
        <Reveal>
          <Card className="max-w-3xl p-6 sm:p-8" hover={false}>
            <p className="text-base leading-relaxed text-fg-muted sm:text-lg">
              {course.audience}
            </p>
          </Card>
        </Reveal>
      </Section>

      {course.instructor && (
        <Section>
          <SectionHeading
            eyebrow="Giảng viên"
            title={`${course.instructor.credential} ${course.instructor.name}`}
          />
          <Reveal>
            <Card className="max-w-4xl p-6 sm:p-8" hover={false}>
              <ul className="space-y-4">
                {course.instructor.highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="flex gap-3 text-base leading-relaxed text-fg-muted"
                  >
                    <IconCheck className="mt-1 shrink-0 text-success" size={17} />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-6">
                {course.instructor.links.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
                  >
                    {item.label}
                    <IconArrow size={15} />
                  </a>
                ))}
              </div>
            </Card>
          </Reveal>
        </Section>
      )}

      <Section soft={Boolean(course.instructor)}>
        <SectionHeading eyebrow="Nội dung đào tạo" title="Lộ trình học" />
        <Reveal>
          <CourseRoadmap course={course} />
        </Reveal>
      </Section>

      <Section soft={!course.instructor}>
        <SectionHeading eyebrow="Kết quả đạt được" title="Sau khóa học" />
        <Reveal>
          <Card className="max-w-4xl p-6 sm:p-8" hover={false}>
            <ul className="space-y-4">
              {course.outcomes.map((outcome) => (
                <li
                  key={outcome}
                  className="flex gap-3 text-base leading-relaxed text-fg-muted"
                >
                  <IconCheck className="mt-1 shrink-0 text-success" size={17} />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      </Section>

      <Section soft={Boolean(course.instructor)}>
        <SectionHeading eyebrow="Học phí & hình thức" title="Thông tin khóa học" />
        <Reveal>
          <Card className="max-w-4xl p-6 sm:p-8" hover={false}>
            <dl>
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-3 first:pt-0">
                <dt className="text-sm text-fg-muted">Học phí</dt>
                <dd className="text-lg font-bold text-primary">
                  {course.price.amount}
                </dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-3">
                <dt className="text-sm text-fg-muted">
                  {course.price.noteLabel ?? "Ưu đãi"}
                </dt>
                <dd className="text-base font-semibold text-success">
                  {course.price.note}
                </dd>
              </div>
              {marketingEnrollmentCount !== undefined && (
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-3">
                  <dt className="text-sm text-fg-muted">Đã đăng ký</dt>
                  <dd className="text-base font-semibold tabular-nums text-fg">
                    {formatCount(marketingEnrollmentCount)} học viên
                  </dd>
                </div>
              )}
              {course.facts.map((fact) => (
                <div
                  key={fact.label}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-3 last:border-0 last:pb-0"
                >
                  <dt className="text-sm text-fg-muted">{fact.label}</dt>
                  <dd className="text-base font-semibold text-fg">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </Reveal>
      </Section>

      {publishedReviews.length > 0 && (
        <Section soft={!course.instructor}>
          <SectionHeading eyebrow="Người học chia sẻ" title="Đánh giá học viên" />
          <div className="grid gap-5 md:grid-cols-2">
            {publishedReviews.map((review, index) => (
              <Reveal key={review.id} delay={index * 60} className="h-full">
                <Card className="h-full p-6" hover={false}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-fg">{review.author}</span>
                    <span className="inline-flex items-center gap-2">
                      <Stars value={review.rating} size={14} />
                      <span className="text-xs text-fg-subtle">
                        {formatDate(new Date(review.createdAt))}
                      </span>
                    </span>
                  </div>
                  {review.comment && (
                    <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">
                      {review.comment}
                    </p>
                  )}
                </Card>
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      <Section
        soft={
          publishedReviews.length > 0
            ? Boolean(course.instructor)
            : !course.instructor
        }
      >
        <SectionHeading eyebrow="Tiếp tục phát triển" title="Khóa học khác" />
        <div className="grid gap-5 md:grid-cols-3">
          {related.map((item, index) => (
            <Reveal key={item.slug} delay={index * 60} className="h-full">
              <Link
                href={`/khoa-hoc/${item.slug}`}
                className="block h-full"
              >
                <Card className="flex h-full flex-col p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                    Mã khóa {item.code} · {item.eyebrow}
                  </p>
                  <h3 className="mt-2 text-lg font-bold leading-snug text-fg">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                    {item.audience}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                    <span className="font-bold text-primary">{item.price.amount}</span>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-primary">
                      Chi tiết <IconArrow size={14} />
                    </span>
                  </div>
                </Card>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

    </>
  );
}
