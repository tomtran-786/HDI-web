import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StructuredData } from "@/components/structured-data";
import { CtaLink } from "@/components/ui/cta-link";
import { IconCheck } from "@/components/ui/icons";
import { Section, SectionHeading } from "@/components/ui/section";
import {
  SERVICE_SLUGS,
  serviceForSlug,
} from "@/content/services";
import { site } from "@/content/site";
import { structuredDataForService } from "@/lib/structured-data";
import { buttonClass } from "@/components/ui/button";

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
          <h1 className="max-w-[22ch] text-[2.25rem] leading-[1.08] font-extrabold tracking-[-0.03em] sm:text-5xl lg:text-[3.25rem]">
            {service.name}
          </h1>
          {service.nameVi && (
            <p className="mt-3 max-w-[54ch] text-base font-semibold text-fg sm:text-lg">
              {service.nameVi}
            </p>
          )}
        </div>
      </section>

      {hasResearchDetails ? (
        <>
          <Section>
            <SectionHeading title="Giới thiệu dịch vụ" />
            <div>
              <p className="max-w-[54ch] text-base leading-relaxed text-fg-muted sm:text-lg">
                {service.summary}
              </p>
            </div>
          </Section>

          <Section>
            <SectionHeading title="Phù hợp với ai" />
            <div>
              <div className="max-w-3xl border-t-2 border-rule pt-5">
                <p className="text-base leading-relaxed text-fg-muted sm:text-lg">
                  {service.bestFor}
                </p>
              </div>
            </div>
          </Section>

          <Section>
            <SectionHeading
              title={service.supportLabel ?? "Nội dung hỗ trợ"}
            />
            <div>
              <div className="max-w-4xl border-t-2 border-rule pt-5">
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
              </div>
            </div>
          </Section>
        </>
      ) : (
        <Section>
          <div>
            <p className="max-w-[54ch] text-base leading-relaxed text-fg-muted sm:text-lg">
              {service.summary}
            </p>
          </div>
        </Section>
      )}

      <Section>
        <div>
          <div className="rounded-card border border-line bg-card p-7 sm:p-9">
            <h2 className="text-2xl font-bold text-fg sm:text-3xl">
              Liên hệ đội ngũ HDI
            </h2>
            <div className="mt-7 flex flex-wrap gap-3">
              <CtaLink
                source="dich-vu-detail"
                target="tu-van"
                className={buttonClass()}
              >
                Đăng ký tư vấn miễn phí
              </CtaLink>
              <CtaLink
                source="dich-vu-detail"
                target="zalo"
                className="inline-flex items-center rounded-button border border-rule px-5 py-2.5 text-sm font-semibold text-fg transition hover:bg-fg hover:text-bg"
              >
                Nhắn Zalo
              </CtaLink>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
