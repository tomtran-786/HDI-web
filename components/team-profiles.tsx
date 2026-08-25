import Image from "next/image";
import { about } from "@/content/about";
import { links } from "@/content/site";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { IconCheck, IconDownload } from "./ui/icons";
import { Reveal } from "./ui/reveal";
import { Section, SectionHeading } from "./ui/section";

/** Hồ sơ đầy đủ của cố vấn và trợ lý, đặt tại trang Về HDI. */
export function TeamProfiles() {
  const advisor = about.advisor;
  const assistant = about.assistant;

  return (
    <Section id="doi-ngu" soft>
      <SectionHeading eyebrow="Đội ngũ HDI" title="Đội ngũ học thuật và nghiên cứu" />

      <Reveal>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
          {advisor.label} – {advisor.labelEn}
        </p>
        <h3 className="mt-2 text-2xl font-bold text-fg">{advisor.name}</h3>
        <p className="mt-1 text-sm text-fg-muted">{advisor.credential}</p>
      </Reveal>

      <div className="mt-7 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10">
        <Reveal>
          <div className="lg:sticky lg:top-24">
            <Image
              src={advisor.portrait.src}
              alt={advisor.portrait.alt}
              width={620}
              height={620}
              sizes="160px"
              className="h-40 w-40 rounded-card border border-line object-cover"
            />

            <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
              Học vấn
            </p>
            <ul className="mt-3 space-y-4">
              {advisor.education.map((education) => (
                <li key={education.degree} className="border-l-2 border-line pl-4">
                  <p className="text-sm font-bold text-fg">{education.degree}</p>
                  <p className="mt-0.5 text-sm text-fg-muted">{education.school}</p>
                  <p className="mt-0.5 text-xs font-semibold text-primary">
                    {education.year}
                  </p>
                  {"note" in education && education.note && (
                    <p className="mt-1 text-xs italic leading-relaxed text-fg-subtle">
                      {education.note}
                    </p>
                  )}
                </li>
              ))}
            </ul>

            <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
              Giải thưởng
            </p>
            <ul className="mt-3 space-y-2">
              {advisor.honors.map((honor) => (
                <li key={honor}>
                  <Badge tone="success">{honor}</Badge>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={links.cv}
                download
                className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
              >
                <IconDownload size={15} />
                CV
              </a>
              <a
                href={links.teachingStatement}
                download
                className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
              >
                <IconDownload size={15} />
                Teaching statement
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="space-y-4 text-[15px] leading-relaxed text-fg-muted sm:text-base">
            {advisor.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <Card className="mt-8 p-6" hover={false}>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
              Vai trò tại HDI
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {advisor.rolesAtHdi.map((role) => (
                <li key={role} className="flex items-start gap-2 text-sm text-fg-muted">
                  <IconCheck size={15} className="mt-0.5 shrink-0 text-primary" />
                  <span>{role}</span>
                </li>
              ))}
            </ul>
          </Card>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Card className="p-6" hover={false}>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                Hướng nghiên cứu
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {advisor.interests.map((topic) => (
                  <Badge key={topic}>{topic}</Badge>
                ))}
              </div>
            </Card>
            <Card className="p-6" hover={false}>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                Phản biện cho tạp chí
              </p>
              <ul className="mt-3 space-y-1.5">
                {advisor.refereeFor.map((journal) => (
                  <li key={journal} className="text-sm text-fg-muted">
                    {journal}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Reveal>
      </div>

      <Reveal delay={120}>
        <Card className="mt-12 border-t border-line p-6 sm:p-8" hover={false}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Image
              src={assistant.portrait.src}
              alt={assistant.portrait.alt}
              width={472}
              height={709}
              sizes="144px"
              className="h-36 w-36 shrink-0 rounded-full border border-line object-cover object-[center_30%]"
            />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                {assistant.label} – {assistant.labelVi}
              </p>
              <h3 className="mt-2 text-2xl font-bold text-fg">{assistant.name}</h3>
              <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-fg-muted sm:text-base">
                {assistant.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
            Vai trò tại HDI
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {assistant.rolesAtHdi.map((role) => (
              <li key={role} className="flex items-start gap-2 text-sm text-fg-muted">
                <IconCheck size={15} className="mt-0.5 shrink-0 text-primary" />
                <span>{role}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={assistant.profile.portfolio}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
            >
              Portfolio
              <span aria-hidden>↗</span>
            </a>
            <a
              href={assistant.profile.resume}
              download
              className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
            >
              <IconDownload size={15} />
              Resume
            </a>
          </div>
        </Card>
      </Reveal>
    </Section>
  );
}
