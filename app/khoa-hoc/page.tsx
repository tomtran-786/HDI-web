import type { Metadata } from "next";
import { CertificateSection } from "@/components/course-certificate";
import { CourseList } from "@/components/course-list";
import { CtaLink } from "@/components/ui/cta-link";
import { IconMessage } from "@/components/ui/icons";
import { Section } from "@/components/ui/section";
import { courses, coursesIntro } from "@/content/course";
import { courseVisibility } from "@/content/course-visibility";
import { site } from "@/content/site";
import { isListed } from "@/lib/course-availability";
import { landingCourseData } from "@/lib/course-sales";
import type { ReviewSummary } from "@/lib/reviews";
import { buttonClass } from "@/components/ui/button";

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
      <section className="border-b border-line bg-bg">
        <div className="shell py-14 sm:py-16 lg:py-20">
        <h1 className="max-w-[22ch] text-[2.25rem] leading-[1.08] font-extrabold tracking-[-0.03em] sm:text-5xl lg:text-[3.25rem]">
          {coursesIntro.title}
        </h1>
        <p className="mt-4 max-w-[54ch] text-lg leading-relaxed text-fg-muted">
          {coursesIntro.subtitle}
        </p>
      </div>
      </section>

      <Section>
        <div>
          <p className="max-w-[54ch] text-base leading-relaxed text-fg-muted sm:text-lg">
            {coursesIntro.intro}
          </p>
          <p className="mb-8 mt-3 max-w-[54ch] text-sm leading-relaxed text-fg-subtle">
            {coursesIntro.guide}
          </p>
        </div>
        {listed.length > 0 ? (
          <CourseList
            courses={listed}
            summaries={summaries}
            availability={availability}
          />
        ) : (
          <div>
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
                className={buttonClass({ className: "mt-6" })}
              >
                Tư vấn miễn phí
              </CtaLink>
            </div>
          </div>
        )}
      </Section>

      {/* Cả bảy khóa đều cấp chứng nhận; khi không còn khóa nào hiện thì trang
          đang ở trạng thái trống, nên khối này ẩn theo. */}
      {listed.length > 0 && <CertificateSection />}

      {/* Lời mời tư vấn của trang này đứng sau khối chứng nhận; vì đã có nó
          nên lời mời ở đầu footer được ẩn trên /khoa-hoc
          (components/footer-cta-card.tsx). */}
      <Section tone="band">
        <div className="grid gap-x-16 gap-y-6 lg:grid-cols-[minmax(0,1.2fr)_auto] lg:items-end">
          <div>
            <h2 className="text-[1.875rem] leading-[1.15] font-bold tracking-[-0.02em] sm:text-4xl">
              Chưa chắc khóa học nào phù hợp với bạn?
            </h2>
            <p className="mt-3 max-w-[54ch] text-lg text-white/85">
              Chia sẻ mục tiêu và giai đoạn nghiên cứu hiện tại để đội ngũ HDI tư
              vấn lộ trình phù hợp, hoàn toàn miễn phí.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <CtaLink
              source="lien-he"
              target="zalo"
              className={buttonClass({ variant: "onBand", size: "lg" })}
            >
              <IconMessage size={18} />
              Nhắn Zalo
            </CtaLink>
            <CtaLink
              source="lien-he"
              target="tu-van"
              className={buttonClass({
                size: "lg",
                className: "border border-white/60 bg-transparent text-white hover:bg-white/10",
              })}
            >
              Tư vấn miễn phí
            </CtaLink>
          </div>
        </div>
      </Section>

    </>
  );
}
