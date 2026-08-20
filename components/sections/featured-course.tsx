import { courses } from "@/content/course";
import { CourseCard } from "../course-card";
import { Reveal } from "../ui/reveal";
import { Section, SectionHeading } from "../ui/section";

export function FeaturedCourse() {
  const [featured] = courses;

  return (
    <Section id="khoa-hoc">
      <SectionHeading
        eyebrow={featured.eyebrow}
        title={featured.title}
        subtitle={featured.audience}
      />

      <Reveal>
        <p className="max-w-xl text-base leading-relaxed text-fg-muted sm:text-lg">
          {featured.intro}
        </p>
      </Reveal>

      {/* One card today. Add `md:grid-cols-2` once a second course exists — at
          length 1 a half-width card just reads as a layout bug. */}
      <div className="mt-8 grid gap-5">
        {courses.map((course, i) => (
          <Reveal key={course.slug} delay={110 + i * 70}>
            <CourseCard course={course} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
