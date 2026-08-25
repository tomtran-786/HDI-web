import type { Metadata } from "next";
import Link from "next/link";
import { about } from "@/content/about";
import { site } from "@/content/site";
import { TeamProfiles } from "@/components/team-profiles";
import { Card } from "@/components/ui/card";
import { CtaLink } from "@/components/ui/cta-link";
import { IconArrow, IconCheck } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { Section, SectionHeading } from "@/components/ui/section";

const DESCRIPTION =
  "HDI Research Center là cộng đồng huấn luyện và hỗ trợ nghiên cứu dành cho sinh viên, học viên cao học, nghiên cứu sinh, giảng viên và nhà nghiên cứu trẻ, dưới sự định hướng chuyên môn của Dr. Tam Trinh – Lead Academic Advisor.";

export const metadata: Metadata = {
  title: `Về HDI Research Center — ${site.name}`,
  description: DESCRIPTION,
  alternates: { canonical: "/ve-hdi" },
};

/** The full introduction to HDI, kept off the landing page for readability. */
export default function AboutHdiPage() {
  const identity = about.identity;

  return (
    <>
      <section className="border-b border-line bg-bg">
        <div className="shell py-14 sm:py-16 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
            {about.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-primary sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            {about.title}
          </h1>
          <p className="mt-3 max-w-3xl text-base font-semibold text-fg sm:text-lg">
            {about.subtitle}
          </p>
          <div className="mt-7 max-w-3xl space-y-4 text-base leading-relaxed text-fg-muted sm:text-lg">
            {about.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <Section>
        <SectionHeading eyebrow="Về HDI" title="HDI là ai?" />

        <Reveal>
          <Card className="p-6 sm:p-8" hover={false}>
            <h2 className="text-xl font-bold text-fg">{identity.mission.title}</h2>
            <div className="mt-4 space-y-4 text-base leading-relaxed text-fg-muted">
              {identity.mission.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </Card>
        </Reveal>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Reveal delay={60} className="h-full">
            <Card className="h-full p-6 sm:p-8" hover={false}>
              <h2 className="text-xl font-bold text-fg">{identity.audience.title}</h2>
              <p className="mt-4 text-base leading-relaxed text-fg-muted">
                {identity.audience.lead}
              </p>
              <CheckList items={identity.audience.items} />
            </Card>
          </Reveal>

          <Reveal delay={120} className="h-full">
            <Card className="h-full p-6 sm:p-8" hover={false}>
              <h2 className="text-xl font-bold text-fg">{identity.howWeWork.title}</h2>
              <div className="mt-4 space-y-3 text-base leading-relaxed text-fg-muted">
                {identity.howWeWork.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <CheckList items={identity.howWeWork.items} />
            </Card>
          </Reveal>
        </div>
      </Section>

      <Section soft>
        <SectionHeading
          eyebrow="Cách HDI đồng hành"
          title={about.model.title}
          subtitle={about.model.subtitle}
        />

        <Reveal>
          <div className="flex flex-col items-stretch gap-2 rounded-card border border-line bg-card p-4 sm:flex-row sm:items-center sm:justify-center sm:gap-4 sm:p-5">
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
            <Reveal key={layer.name} delay={60 + index * 60} className="h-full">
              <Card className="h-full p-6" hover={false}>
                <h2 className="text-base font-bold text-fg">{layer.name}</h2>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                  {layer.body}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>

      </Section>

      <Section>
        <SectionHeading eyebrow="Cam kết của HDI" title={about.principles.title} />
        <div className="grid gap-5 sm:grid-cols-2">
          {about.principles.items.map((principle, index) => (
            <Reveal key={principle.name} delay={index * 50} className="h-full">
              <Card className="h-full p-6 sm:p-7" hover={false}>
                <h2 className="text-lg font-bold text-fg">{principle.name}</h2>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted sm:text-base">
                  {principle.body}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      <TeamProfiles />

      <Section>
        <SectionHeading
          eyebrow="Nền tảng chuyên môn"
          title={about.record.title}
          subtitle={about.record.subtitle}
        />
        <Reveal>
          <Card className="p-6 sm:p-8" hover={false}>
            <div className="max-w-3xl space-y-3 text-base leading-relaxed text-fg-muted">
              {about.record.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <CheckList items={about.record.items} columns />
            <Link
              href={about.record.cta.href}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
            >
              {about.record.cta.label}
              <IconArrow size={15} />
            </Link>
          </Card>
        </Reveal>
      </Section>

      <Section soft>
        <Reveal>
          <div className="rounded-card border border-line bg-card p-7 sm:p-9">
            <h2 className="text-2xl font-bold text-fg sm:text-3xl">
              {about.closing.title}
            </h2>
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
              <Link
                href="/khoa-hoc"
                className="inline-flex items-center rounded-full border border-line px-5 py-2.5 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
              >
                Xem chương trình đào tạo
              </Link>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}

function CheckList({
  items,
  columns = false,
}: {
  items: readonly string[];
  columns?: boolean;
}) {
  return (
    <ul className={`mt-5 grid gap-3 ${columns ? "sm:grid-cols-2" : ""}`}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-fg-muted">
          <IconCheck size={15} className="mt-0.5 shrink-0 text-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
