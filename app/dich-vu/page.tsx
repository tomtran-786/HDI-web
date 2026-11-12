import type { Metadata } from "next";
import Link from "next/link";
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
        <h1 className="max-w-[22ch] text-[2.25rem] leading-[1.08] font-extrabold tracking-[-0.03em] sm:text-5xl lg:text-[3.25rem]">
          {serviceCatalog.title}
        </h1>
        <p className="mt-4 max-w-[54ch] text-lg leading-relaxed text-fg-muted">
          {serviceCatalog.subtitle}
        </p>
      </div>
      </section>

      {serviceCatalog.groups.map((group) => (
        <Section key={group.id} id={group.id}>
          <SectionHeading
            title={group.title}
            subtitle={group.subtitle}
          />

          {group.id === "dong-hanh-nghien-cuu" && (
            <div>
              <p className="mb-8 max-w-[54ch] text-lg leading-relaxed text-fg-muted">
                {serviceCatalog.researchIntro}
              </p>
            </div>
          )}

          {/* Danh sách kẻ hai cột thay cho lưới thẻ icon: tên dịch vụ là liên
              kết, tên tiếng Việt và tóm tắt đi ngay dưới. */}
          <ul className="grid border-t-2 border-rule md:grid-cols-2 md:gap-x-12">
            {group.items.map((service) => (
              <li key={service.href} className="border-b border-line py-6">
                <h3 className="text-xl font-bold">
                  <Link
                    href={service.href}
                    className="hover:text-primary hover:underline hover:underline-offset-4"
                  >
                    {service.name}
                  </Link>
                </h3>
                {service.nameVi && (
                  <p className="mt-1 text-sm font-semibold text-fg-subtle">{service.nameVi}</p>
                )}
                <p className="mt-3 max-w-[54ch] text-[0.9375rem] leading-relaxed text-fg-muted">
                  {service.summary}
                </p>
              </li>
            ))}
          </ul>

          {group.id === "dong-hanh-nghien-cuu" && (
            <div>
              <p className="mt-8 text-sm text-fg-muted">
                {serviceCatalog.researchNote}
              </p>
            </div>
          )}
        </Section>
      ))}

    </>
  );
}
