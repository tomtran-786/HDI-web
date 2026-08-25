import type { Metadata } from "next";
import { CourseList } from "@/components/course-list";
import { CtaLink } from "@/components/ui/cta-link";
import { IconArrow, IconMessage } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { Section, SectionHeading } from "@/components/ui/section";
import { courses, coursesIntro } from "@/content/course";
import { site } from "@/content/site";
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

  return (
    <>
      <Section>
        <SectionHeading
          eyebrow={coursesIntro.eyebrow}
          title={coursesIntro.title}
          subtitle={coursesIntro.subtitle}
        />
        <Reveal>
          <p className="max-w-3xl text-base leading-relaxed text-fg-muted sm:text-lg">
            {coursesIntro.intro}
          </p>
          <p className="mb-8 mt-3 max-w-3xl text-sm leading-relaxed text-fg-subtle">
            {coursesIntro.guide}
          </p>
        </Reveal>
        <CourseList
          courses={courses}
          summaries={summaries}
          availability={availability}
        />
      </Section>

      <Section soft>
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
