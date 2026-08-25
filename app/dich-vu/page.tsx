import type { Metadata } from "next";
import Link from "next/link";
import { programIcons, IconArrow } from "@/components/ui/icons";
import { Card } from "@/components/ui/card";
import { CtaLink } from "@/components/ui/cta-link";
import { Reveal } from "@/components/ui/reveal";
import { Section, SectionHeading } from "@/components/ui/section";
import { serviceCatalog } from "@/content/services";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: `Dịch vụ — ${site.name}`,
  description:
    "Các lộ trình đồng hành nghiên cứu và dịch vụ hỗ trợ bản thảo của HDI Research Center.",
  alternates: { canonical: "/dich-vu" },
};

export default function ServicesPage() {
  return (
    <>
      <section className="border-b border-line bg-bg">
        <div className="shell py-14 sm:py-16 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
            {serviceCatalog.eyebrow}
          </p>
          <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-primary sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            {serviceCatalog.title}
          </h1>
          <p className="mt-3 max-w-3xl text-base text-fg-muted sm:text-lg">
            {serviceCatalog.subtitle}
          </p>
        </div>
      </section>

      {serviceCatalog.groups.map((group, groupIndex) => (
        <Section key={group.id} id={group.id} soft={groupIndex % 2 === 0}>
          <SectionHeading
            eyebrow={group.eyebrow}
            title={group.title}
            subtitle={group.subtitle}
          />

          {group.id === "dong-hanh-nghien-cuu" && (
            <Reveal>
              <p className="mb-8 max-w-3xl text-base leading-relaxed text-fg-muted sm:text-lg">
                {serviceCatalog.researchIntro}
              </p>
            </Reveal>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            {group.items.map((service, index) => {
              const Icon = service.icon ? programIcons[service.icon] : null;
              return (
                <Reveal key={service.href} delay={index * 60} className="h-full">
                  <Card className="flex h-full flex-col p-6 sm:p-7">
                    {Icon && (
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-tint text-primary">
                        <Icon />
                      </span>
                    )}
                    <h2 className={`${Icon ? "mt-5" : ""} text-lg font-bold text-fg`}>
                      {service.name}
                    </h2>
                    {service.nameVi && (
                      <p className="mt-1 text-sm font-semibold text-primary">
                        {service.nameVi}
                      </p>
                    )}
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-fg-muted">
                      {service.summary}
                    </p>
                    <Link
                      href={service.href}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                    >
                      Xem chi tiết
                      <IconArrow size={15} />
                    </Link>
                  </Card>
                </Reveal>
              );
            })}
          </div>

          {group.id === "dong-hanh-nghien-cuu" && (
            <Reveal delay={140}>
              <p className="mt-8 text-sm text-fg-muted">
                {serviceCatalog.researchNote}
              </p>
            </Reveal>
          )}
        </Section>
      ))}

      <Section soft>
        <Reveal>
          <div className="rounded-card border border-line bg-card p-7 sm:p-9">
            <h2 className="text-2xl font-bold text-fg sm:text-3xl">
              Trao đổi về nhu cầu của bạn
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-fg-muted">
              Liên hệ đội ngũ HDI để chọn dịch vụ phù hợp với đề tài hoặc bản thảo hiện tại.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <CtaLink
                source="dich-vu-hub"
                target="tu-van"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
              >
                Đăng ký tư vấn miễn phí
                <IconArrow size={15} />
              </CtaLink>
              <CtaLink
                source="dich-vu-hub"
                target="zalo"
                className="inline-flex items-center rounded-full border border-line px-5 py-2.5 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
              >
                Nhắn Zalo
              </CtaLink>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
