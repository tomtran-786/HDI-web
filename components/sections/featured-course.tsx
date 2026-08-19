import { course } from "@/content/course";
import { links } from "@/content/site";
import { Reveal } from "../ui/reveal";
import { Section, SectionHeading } from "../ui/section";
import { IconArrow, IconCheck } from "../ui/icons";

export function FeaturedCourse() {
  return (
    <Section id="khoa-hoc">
      <SectionHeading
        eyebrow={course.eyebrow}
        title={course.title}
        subtitle={course.audience}
      />

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          <p className="max-w-xl text-base leading-relaxed text-fg-muted sm:text-lg">
            {course.intro}
          </p>

          <ol className="mt-8 space-y-0">
            {course.syllabus.map((item, i) => (
              <li
                key={item}
                className="flex gap-4 border-b border-line py-3.5 last:border-0"
              >
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-tint text-[11px] font-bold text-primary">
                  {i + 1}
                </span>
                <span className="text-[15px] leading-relaxed text-fg">
                  <span className="font-semibold">Buổi {i + 1}:</span> {item}
                </span>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delay={110}>
          {/* filled panel — the flagship offer, echoing the reference's blue CTA block */}
          <div className="rounded-card bg-primary p-6 text-primary-fg sm:p-7">
            <dl className="space-y-0">
              {course.facts.map((fact) => (
                <div
                  key={fact.label}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/20 py-3 first:pt-0 last:border-0"
                >
                  <dt className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">
                    {fact.label}
                  </dt>
                  <dd className="text-[15px] font-semibold">{fact.value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">
              Sau khóa học
            </p>
            <ul className="mt-3 space-y-3">
              {course.outcomes.map((o) => (
                <li key={o} className="flex gap-3 text-sm leading-relaxed">
                  <IconCheck className="mt-0.5 shrink-0 opacity-80" size={17} />
                  <span>{o}</span>
                </li>
              ))}
            </ul>

            <a
              href={links.register}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary-fg px-6 py-3 text-sm font-bold text-primary transition hover:opacity-90"
            >
              Đăng ký khóa học
              <IconArrow size={16} />
            </a>
            <p className="mt-3 text-center text-xs leading-relaxed opacity-75">
              {course.registerNote}
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
