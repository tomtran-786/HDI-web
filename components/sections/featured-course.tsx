import { courses, coursesIntro } from "@/content/course";
import { CourseList } from "../course-list";
import { Reveal } from "../ui/reveal";
import { Section, SectionHeading } from "../ui/section";

export function FeaturedCourse() {
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
      <CourseList courses={courses} />
    </Section>
  );
}
