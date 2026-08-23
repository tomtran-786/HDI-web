import Image from "next/image";
import Link from "next/link";
import { about } from "@/content/about";
import { links } from "@/content/site";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { Reveal } from "../ui/reveal";
import { Section, SectionHeading } from "../ui/section";
import { IconArrow, IconDownload } from "../ui/icons";

/**
 * The centre first, its academic adviser second. The two halves are separated
 * by a rule rather than merged, so the adviser's CV never reads as the
 * centre's own identity.
 */
export function About() {
  const advisor = about.advisor;

  return (
    <Section id="ve-chung-toi" soft>
      <SectionHeading
        eyebrow={about.eyebrow}
        title={about.title}
        subtitle={about.subtitle}
      />

      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <Reveal>
          <div className="space-y-5 text-base leading-relaxed text-fg-muted sm:text-[17px]">
            {about.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Reveal>

        <Reveal delay={100}>
          {/* decorative — the paragraphs beside it already say all of this */}
          <Image
            src={about.illustration.src}
            alt=""
            aria-hidden
            width={560}
            height={560}
            className="mx-auto h-auto w-full max-w-sm lg:max-w-none"
          />
        </Reveal>
      </div>

      <div className="mt-12 border-t border-line pt-10">
        <Reveal>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
            {advisor.label}
          </p>
          <h3 className="mt-2 text-2xl font-bold text-fg">{advisor.name}</h3>
          <p className="mt-1 text-sm text-fg-muted">{advisor.credential}</p>
          {/* The record itself — publications, funded projects, conferences,
              supervisions — is a page of its own, so this section stays a
              profile instead of turning into four long tables. */}
          <Link
            href="/cong-bo"
            className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
          >
            Xem công bố, dự án, hội thảo và hồ sơ hướng dẫn
            <IconArrow size={15} />
          </Link>
        </Reveal>

        <div className="mt-7 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10">
          <Reveal>
            <div className="lg:sticky lg:top-24">
              <Image
                src={advisor.portrait.src}
                alt={advisor.portrait.alt}
                width={620}
                height={620}
                className="h-40 w-40 rounded-card border border-line object-cover"
              />

              <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                Học vấn
              </p>
              <ul className="mt-3 space-y-4">
                {advisor.education.map((e) => (
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

              <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                Giải thưởng
              </p>
              <ul className="mt-3 space-y-2">
                {advisor.honors.map((h) => (
                  <li key={h}>
                    <Badge tone="success">{h}</Badge>
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
              {advisor.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <Card className="p-6" hover={false}>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                  Hướng nghiên cứu
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {advisor.interests.map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
              </Card>
              <Card className="p-6" hover={false}>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                  Phản biện cho tạp chí
                </p>
                <ul className="mt-3 space-y-1.5">
                  {advisor.refereeFor.map((j) => (
                    <li key={j} className="text-sm text-fg-muted">
                      {j}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
