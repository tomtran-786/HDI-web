import Image from "next/image";
import Link from "next/link";
import { about } from "@/content/about";
import { links } from "@/content/site";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { CtaLink } from "../ui/cta-link";
import { Reveal } from "../ui/reveal";
import { Section, SectionHeading } from "../ui/section";
import { IconArrow, IconCheck, IconDownload } from "../ui/icons";

/**
 * A concise home-page introduction. The full identity, principles and academic
 * foundation live at /ve-hdi; the operating model and team stay here so a new
 * visitor can understand who provides the support without leaving the page.
 */
export function About() {
  const advisor = about.advisor;
  const assistant = about.assistant;

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
            {about.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Reveal>

        <Reveal delay={100}>
          <Image
            src={about.illustration.src}
            alt=""
            aria-hidden
            width={560}
            height={560}
            sizes="(min-width: 1024px) 560px, (min-width: 640px) 384px, calc(100vw - 3rem)"
            className="mx-auto h-auto w-full max-w-sm lg:max-w-none"
          />
        </Reveal>
      </div>

      <div className="mt-14 border-t border-line pt-12">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
            Cách HDI đồng hành
          </p>
          <h3 className="mt-2 text-2xl font-bold text-fg sm:text-3xl">
            {about.model.title}
          </h3>
          <p className="mt-2 max-w-2xl text-base text-fg-muted sm:text-lg">
            {about.model.subtitle}
          </p>
        </Reveal>

        <Reveal delay={70}>
          <div className="mt-7 flex flex-col items-stretch gap-2 rounded-card border border-line bg-card p-4 sm:flex-row sm:items-center sm:justify-center sm:gap-4 sm:p-5">
            {about.model.chain.map((step, index) => (
              <div
                key={step}
                className="contents sm:flex sm:items-center sm:gap-4"
              >
                <span className="rounded-full bg-tint px-4 py-2 text-center text-sm font-bold text-primary">
                  {step}
                </span>
                {index < about.model.chain.length - 1 && (
                  <span
                    aria-hidden
                    className="text-center text-lg font-bold text-primary"
                  >
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </Reveal>

        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {about.model.layers.map((layer, index) => (
            <Reveal key={layer.name} delay={90 + index * 60} className="h-full">
              <Card className="h-full p-6" hover={false}>
                <p className="text-base font-bold text-fg">{layer.name}</p>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                  {layer.body}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>

        <Reveal delay={130}>
          <Link
            href="/ve-hdi"
            className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
          >
            Tìm hiểu thêm về HDI Research Center
            <IconArrow size={15} />
          </Link>
        </Reveal>
      </div>

      <div className="mt-14 border-t border-line pt-12">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
            Đội ngũ HDI
          </p>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
            {advisor.label} – {advisor.labelEn}
          </p>
          <h3 className="mt-2 text-2xl font-bold text-fg">{advisor.name}</h3>
          <p className="mt-1 text-sm text-fg-muted">{advisor.credential}</p>
          <Link
            href="/cong-bo"
            className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
          >
            Xem hồ sơ học thuật của Dr. Tam Trinh
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
                    {education.note && (
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
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
              {assistant.label} – {assistant.labelVi}
            </p>
            <h3 className="mt-2 text-2xl font-bold text-fg">{assistant.name}</h3>
            <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-fg-muted sm:text-base">
              {assistant.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
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
          </Card>
        </Reveal>
      </div>

      <Reveal>
        <div className="mt-14 rounded-card border border-line bg-card p-7 sm:p-9">
          <h3 className="text-2xl font-bold text-fg sm:text-3xl">
            {about.closing.title}
          </h3>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-fg-muted sm:text-lg">
            {about.closing.body}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <CtaLink
              source="lien-he"
              target="tu-van"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
            >
              Đăng ký tư vấn miễn phí
              <IconArrow size={15} />
            </CtaLink>
            <a
              href="#khoa-hoc"
              className="inline-flex items-center rounded-full border border-line px-5 py-2.5 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
            >
              Xem chương trình đào tạo
            </a>
            <a
              href="#lien-he"
              className="inline-flex items-center rounded-full border border-line px-5 py-2.5 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
            >
              Liên hệ đội ngũ HDI
            </a>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
