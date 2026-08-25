import Link from "next/link";
import { CourseTeaserCard } from "../course-teaser-card";
import { courses, coursesIntro } from "@/content/course";
import { Reveal } from "../ui/reveal";
import { Section, SectionHeading } from "../ui/section";
import { IconArrow } from "../ui/icons";

const featuredSlugs = [
  "training-tieu-luan-nckh-kltn",
  "nckh-chuyen-sau-spss",
  "ung-dung-chatgpt-nckh",
] as const;

const featuredCourses = featuredSlugs.map((slug) => {
  const course = courses.find((item) => item.slug === slug);
  if (!course) throw new Error(`Thiếu dữ liệu teaser khóa học: ${slug}`);
  // Chỉ truyền bốn trường này qua ranh giới server → client. Nếu đưa nguyên
  // object khóa học vào CourseTeaserCard, curriculum, giá và facts vẫn bị
  // serialize vào RSC payload dù component không render chúng.
  return {
    slug: course.slug,
    eyebrow: course.eyebrow,
    title: course.title,
    audience: course.audience,
  };
});

/** Ba teaser tĩnh; dữ liệu bán hàng/review chỉ được tải tại hub và detail. */
export function FeaturedCourse() {
  return (
    <Section id="khoa-hoc" soft>
      <SectionHeading
        eyebrow={coursesIntro.eyebrow}
        title={coursesIntro.title}
        subtitle={coursesIntro.subtitle}
      />

      <div className="grid gap-5 md:grid-cols-3">
        {featuredCourses.map((course, index) => (
          <Reveal key={course.slug} delay={index * 60} className="h-full">
            <CourseTeaserCard course={course} />
          </Reveal>
        ))}
      </div>

      <Reveal>
        <Link
          href="/khoa-hoc"
          className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          Xem tất cả khóa học
          <IconArrow size={15} />
        </Link>
      </Reveal>
    </Section>
  );
}
