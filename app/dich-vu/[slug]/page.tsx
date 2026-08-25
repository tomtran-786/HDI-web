import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StructuredData } from "@/components/structured-data";
import { Card } from "@/components/ui/card";
import { CtaLink } from "@/components/ui/cta-link";
import { IconArrow, IconCheck } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { Section, SectionHeading } from "@/components/ui/section";
import {
  SERVICE_SLUGS,
  serviceForSlug,
} from "@/content/services";
import { site } from "@/content/site";
import { structuredDataForService } from "@/lib/structured-data";

type ServicePageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return SERVICE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = serviceForSlug(slug);
  if (!service?.slug) notFound();

  return {
    title: `${service.name} — ${site.name}`,
    description: service.summary,
    alternates: { canonical: service.href },
  };
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = serviceForSlug(slug);
  if (!service?.slug) notFound();

  const hasResearchDetails = Boolean(
    service.bestFor && service.supportLabel && service.support?.length,
  );

  return (
    <>
      <StructuredData
        id={`service-structured-data-${service.slug}`}
        data={structuredDataForService(service)}
      />

      <section className="border-b border-line bg-bg">
        <div className="shell py-14 sm:py-16 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
            Dịch vụ HDI
          </p>
          <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-primary sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            {service.name}
          </h1>
          {service.nameVi && (
            <p className="mt-3 max-w-3xl text-base font-semibold text-fg sm:text-lg">
              {service.nameVi}
            </p>
          )}
        </div>
      </section>

      {hasResearchDetails ? (
        <>
          <Section>
            <SectionHeading eyebrow="Tổng quan" title="Giới thiệu dịch vụ" />
            <Reveal>
              <p className="max-w-3xl text-base leading-relaxed text-fg-muted sm:text-lg">
                {service.summary}
              </p>
            </Reveal>
          </Section>

          <Section soft>
            <SectionHeading eyebrow="Đối tượng" title="Phù hợp với ai" />
            <Reveal>
              <Card className="max-w-3xl p-6 sm:p-8" hover={false}>
                <p className="text-base leading-relaxed text-fg-muted sm:text-lg">
                  {service.bestFor}
                </p>
              </Card>
            </Reveal>
          </Section>

          <Section>
            <SectionHeading
              eyebrow="Nội dung"
              title={service.supportLabel ?? "Nội dung hỗ trợ"}
            />
            <Reveal>
              <Card className="max-w-4xl p-6 sm:p-8" hover={false}>
                <ul className="space-y-4">
                  {service.support?.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 text-base leading-relaxed text-fg-muted"
                    >
                      <IconCheck className="mt-1 shrink-0 text-success" size={17} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </Reveal>
          </Section>
        </>
      ) : (
        <Section>
          <Reveal>
            <p className="max-w-3xl text-base leading-relaxed text-fg-muted sm:text-lg">
              {service.summary}
            </p>
          </Reveal>
        </Section>
      )}

      <Section soft>
        <Reveal>
          <div className="rounded-card border border-line bg-card p-7 sm:p-9">
            <h2 className="text-2xl font-bold text-fg sm:text-3xl">
              Liên hệ đội ngũ HDI
            </h2>
            <div className="mt-7 flex flex-wrap gap-3">
              <CtaLink
                source="dich-vu-detail"
                target="tu-van"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
              >
                Đăng ký tư vấn miễn phí
                <IconArrow size={15} />
              </CtaLink>
              <CtaLink
                source="dich-vu-detail"
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
