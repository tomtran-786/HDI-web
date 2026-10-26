import type { Metadata } from "next";
import { CertificateSection } from "@/components/course-certificate";
import { CourseList } from "@/components/course-list";
import { PageBackdrop } from "@/components/page-backdrop";
import { CtaLink } from "@/components/ui/cta-link";
import { IconArrow, IconMessage } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { courses, coursesIntro } from "@/content/course";
import { courseVisibility } from "@/content/course-visibility";
import { site } from "@/content/site";
import { isListed } from "@/lib/course-availability";
import { landingCourseData } from "@/lib/course-sales";
import type { ReviewSummary } from "@/lib/reviews";

export const metadata: Metadata = {
  title: `Khóa học — ${site.name}`,
  description: coursesIntro.intro,
  alternates: { canonical: "/khoa-hoc" },
};

async function loadCourseData() {
  try {
    return await landingCourseData();
  } catch (error) {
    console.error("[khoa-hoc] Không đọc được dữ liệu công khai:", error);
    return {
      summaries: {} as Record<string, ReviewSummary>,
      reviews: {},
      availability: null,
    };
  }
}

export default async function CoursesPage() {
  const { summaries, availability } = await loadCourseData();
  // Khóa chưa mở bán không hiện ở danh sách; `full` vẫn hiện kèm badge. Khi
  // không đọc được dữ liệu (`availability === null`) thì hiện đủ, như trước.
  const listed = courses.filter((course) => isListed(availability, course.slug));

  return (
    <>
      <PageBackdrop>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
          {coursesIntro.eyebrow}
        </p>
        <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-primary sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
          {coursesIntro.title}
        </h1>
        <p className="mt-3 max-w-3xl text-base text-fg-muted sm:text-lg">
          {coursesIntro.subtitle}
        </p>
      </PageBackdrop>

      <Section>
        <Reveal>
          <p className="max-w-3xl text-base leading-relaxed text-fg-muted sm:text-lg">
            {coursesIntro.intro}
          </p>
          <p className="mb-8 mt-3 max-w-3xl text-sm leading-relaxed text-fg-subtle">
            {coursesIntro.guide}
          </p>
        </Reveal>
        {listed.length > 0 ? (
          <CourseList
            courses={listed}
            summaries={summaries}
            availability={availability}
          />
        ) : (
          <Reveal>
            <div className="rounded-card border border-line bg-card p-7 text-center sm:p-10">
              <h2 className="text-xl font-bold text-fg sm:text-2xl">
                {courseVisibility.listEmpty.title}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-fg-muted">
                {courseVisibility.listEmpty.body}
              </p>
              <CtaLink
                source="lien-he"
                target="tu-van"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
              >
                Tư vấn miễn phí
                <IconArrow size={15} />
              </CtaLink>
            </div>
          </Reveal>
        )}
      </Section>

      {/* Cả bảy khóa đều cấp chứng nhận; khi không còn khóa nào hiện thì trang
          đang ở trạng thái trống, nên khối này ẩn theo. */}
      {listed.length > 0 && <CertificateSection soft />}

      <Section soft={listed.length === 0}>
        <Reveal>
          <div className="rounded-card border border-line bg-card p-7 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
              Chọn đúng lộ trình
            </p>
            <h2 className="mt-3 text-2xl font-bold text-fg sm:text-3xl">
              Chưa chắc khóa học nào phù hợp với bạn?
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-fg-muted sm:text-lg">
              Chia sẻ mục tiêu và giai đoạn nghiên cứu hiện tại để đội ngũ HDI
              tư vấn lộ trình phù hợp, hoàn toàn miễn phí.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <CtaLink
                source="lien-he"
                target="tu-van"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
              >
                Tư vấn miễn phí
                <IconArrow size={15} />
              </CtaLink>
              <CtaLink
                source="lien-he"
                target="zalo"
                className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
              >
                <IconMessage size={15} />
                Nhắn Zalo
              </CtaLink>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
