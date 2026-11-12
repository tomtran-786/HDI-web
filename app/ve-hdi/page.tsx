import type { Metadata } from "next";
import Link from "next/link";
import { about } from "@/content/about";
import { site } from "@/content/site";
import { TeamProfiles } from "@/components/team-profiles";
import { CtaLink } from "@/components/ui/cta-link";
import { IconCheck } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { Section, SectionHeading } from "@/components/ui/section";
import { buttonClass } from "@/components/ui/button";

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
          <h1 className="max-w-[22ch] text-[2.25rem] leading-[1.08] font-extrabold tracking-[-0.03em] sm:text-5xl lg:text-[3.25rem]">
            {about.title}
          </h1>
          <p className="mt-3 max-w-[54ch] text-base font-semibold text-fg sm:text-lg">
            {about.subtitle}
          </p>
          <div className="mt-7 max-w-[54ch] space-y-4 text-base leading-relaxed text-fg-muted sm:text-lg">
            {about.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <Section>
        <SectionHeading title="HDI là ai?" />

        <Reveal>
          <div className="border-t-2 border-rule pt-5">
            <h2 className="text-xl font-bold text-fg">{identity.mission.title}</h2>
            <div className="mt-4 space-y-4 text-base leading-relaxed text-fg-muted max-w-[62ch]">
              {identity.mission.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Reveal delay={60} className="h-full">
            <div className="h-full border-t-2 border-rule pt-5">
              <h2 className="text-xl font-bold text-fg">{identity.audience.title}</h2>
              <p className="mt-4 text-base leading-relaxed text-fg-muted">
                {identity.audience.lead}
              </p>
              <CheckList items={identity.audience.items} />
            </div>
          </Reveal>

          <Reveal delay={120} className="h-full">
            <div className="h-full border-t-2 border-rule pt-5">
              <h2 className="text-xl font-bold text-fg">{identity.howWeWork.title}</h2>
              <div className="mt-4 space-y-3 text-base leading-relaxed text-fg-muted max-w-[62ch]">
                {identity.howWeWork.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <CheckList items={identity.howWeWork.items} />
            </div>
          </Reveal>
        </div>
      </Section>

      <Section>
        <SectionHeading
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
                <span className="rounded-xs bg-tint px-4 py-2 text-center text-sm font-semibold text-primary">
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
              <div className="h-full border-t-2 border-rule pt-5">
                <h2 className="text-base font-bold text-fg">{layer.name}</h2>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                  {layer.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

      </Section>

      <Section>
        <SectionHeading title={about.principles.title} />
        <div className="grid gap-5 sm:grid-cols-2">
          {about.principles.items.map((principle, index) => (
            <Reveal key={principle.name} delay={index * 50} className="h-full">
              <div className="h-full border-t-2 border-rule pt-5">
                <h2 className="text-lg font-bold text-fg">{principle.name}</h2>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted sm:text-base">
                  {principle.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <TeamProfiles />

      <Section>
        <SectionHeading
          title={about.record.title}
          subtitle={about.record.subtitle}
        />
        <Reveal>
          <div className="border-t-2 border-rule pt-5">
            <div className="max-w-[54ch] space-y-3 text-base leading-relaxed text-fg-muted">
              {about.record.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <CheckList items={about.record.items} columns />
            <Link
              href={about.record.cta.href}
              className="mt-7 inline-flex items-center gap-2 rounded-button bg-primary px-5 py-2.5 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
            >
              {about.record.cta.label}
            </Link>
          </div>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <div className="rounded-card border border-line bg-card p-7 sm:p-9">
            <h2 className="text-2xl font-bold text-fg sm:text-3xl">
              {about.closing.title}
            </h2>
            <p className="mt-3 max-w-[54ch] text-base leading-relaxed text-fg-muted sm:text-lg">
              {about.closing.body}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <CtaLink
                source="lien-he"
                target="tu-van"
                className={buttonClass()}
              >
                Đăng ký tư vấn miễn phí
              </CtaLink>
              <Link
                href="/khoa-hoc"
                className="inline-flex items-center rounded-button border border-rule px-5 py-2.5 text-sm font-semibold text-fg transition hover:bg-fg hover:text-bg"
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
