import { programIcons } from "../ui/icons";
import { programs, programsIntro } from "@/content/programs";
import { Card } from "../ui/card";
import { CtaLink } from "../ui/cta-link";
import { Reveal } from "../ui/reveal";
import { Section, SectionHeading } from "../ui/section";
import { IconArrow, IconCheck } from "../ui/icons";

export function Programs() {
  return (
    <Section id="chuong-trinh" soft>
      <SectionHeading
        eyebrow={programsIntro.eyebrow}
        title={programsIntro.title}
        subtitle={programsIntro.subtitle}
      />

      <Reveal>
        <p className="mb-8 max-w-3xl text-base leading-relaxed text-fg-muted sm:text-lg">
          {programsIntro.intro}
        </p>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-2">
        {programs.map((program, i) => {
          const Icon = programIcons[program.icon];
          return (
            <Reveal key={program.name} delay={i * 70}>
              <Card className="flex h-full flex-col p-6">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-tint text-primary">
                  <Icon />
                </span>
                <h3 className="mt-5 text-lg font-bold text-fg">{program.name}</h3>
                <p className="mt-1 text-sm font-semibold text-primary">
                  {program.nameVi}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                  {program.summary}
                </p>
                <div className="mt-5 border-t border-line pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                    Phù hợp với
                  </p>
                  <p className="mt-1.5 text-sm text-fg-muted">{program.bestFor}</p>
                </div>
                <div className="mt-5 border-t border-line pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                    {program.supportLabel}
                  </p>
                  <ul className="mt-3 space-y-2.5">
                    {program.support.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm leading-relaxed text-fg-muted"
                      >
                        <IconCheck
                          size={15}
                          className="mt-0.5 shrink-0 text-primary"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </Reveal>
          );
        })}
      </div>

      <Reveal delay={140}>
        <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-card border border-line bg-card px-6 py-5 sm:flex-row sm:items-center">
          <p className="text-sm text-fg-muted">{programsIntro.note}</p>
          <CtaLink
            source="chuong-trinh"
            target="tu-van"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-primary hover:underline"
          >
            Đăng ký buổi tư vấn miễn phí
            <IconArrow size={15} />
          </CtaLink>
        </div>
      </Reveal>
    </Section>
  );
}
