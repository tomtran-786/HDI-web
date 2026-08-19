import Image from "next/image";
import { about } from "@/content/about";
import { links } from "@/content/site";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { Reveal } from "../ui/reveal";
import { Section, SectionHeading } from "../ui/section";
import { IconDownload } from "../ui/icons";

export function About() {
  return (
    <Section id="ve-chung-toi">
      <SectionHeading
        eyebrow={about.eyebrow}
        title={about.title}
        subtitle={about.subtitle}
      />

      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal>
          <div className="lg:sticky lg:top-24">
            <Image
              src={about.portrait.src}
              alt={about.portrait.alt}
              width={620}
              height={620}
              className="h-40 w-40 rounded-card border border-line object-cover"
            />

            <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
              Học vấn
            </p>
            <ul className="mt-3 space-y-4">
              {about.education.map((e) => (
                <li key={e.degree} className="border-l-2 border-line pl-4">
                  <p className="text-sm font-bold text-fg">{e.degree}</p>
                  <p className="mt-0.5 text-sm text-fg-muted">{e.school}</p>
                  <p className="mt-0.5 text-xs font-semibold text-primary">{e.year}</p>
                  {e.note && (
                    <p className="mt-1 text-xs italic leading-relaxed text-fg-subtle">
                      {e.note}
                    </p>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={links.cv}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
              >
                <IconDownload size={15} />
                CV
              </a>
              <a
                href={links.teachingStatement}
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
            {about.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <Card className="p-6" hover={false}>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                Hướng nghiên cứu
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {about.interests.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            </Card>
            <Card className="p-6" hover={false}>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                Phản biện cho tạp chí
              </p>
              <ul className="mt-3 space-y-1.5">
                {about.refereeFor.map((j) => (
                  <li key={j} className="text-sm text-fg-muted">
                    {j}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
