import Link from "next/link";
import { serviceCatalog } from "@/content/services";
import { Card } from "../ui/card";
import { IconArrow } from "../ui/icons";
import { Reveal } from "../ui/reveal";
import { Section, SectionHeading } from "../ui/section";

/** Homepage chỉ giới thiệu hai nhóm; sáu dịch vụ đầy đủ nằm ở /dich-vu. */
export function Services() {
  return (
    <Section id="dich-vu" soft>
      <SectionHeading
        eyebrow={serviceCatalog.eyebrow}
        title={serviceCatalog.title}
        subtitle={serviceCatalog.subtitle}
      />

      <div className="grid gap-5 md:grid-cols-2">
        {serviceCatalog.groups.map((group, index) => (
          <Reveal key={group.id} delay={index * 80} className="h-full">
            <div
              id={group.id === "dong-hanh-nghien-cuu" ? "chuong-trinh" : undefined}
              className="h-full scroll-mt-24"
            >
              <Card className="h-full p-6 sm:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                  {group.eyebrow}
                </p>
                <h3 className="mt-2 text-xl font-bold text-fg">{group.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-fg-muted sm:text-base">
                  {group.subtitle}
                </p>
                <Link
                  href={`/dich-vu#${group.id}`}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                >
                  Xem nhóm dịch vụ
                  <IconArrow size={15} />
                </Link>
              </Card>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
