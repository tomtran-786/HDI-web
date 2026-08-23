import Link from "next/link";
import { services } from "@/content/services";
import { composeEmailHref, contact } from "@/content/site";
import { IconArrow } from "../ui/icons";
import { Card } from "../ui/card";
import { Reveal } from "../ui/reveal";
import { Section, SectionHeading } from "../ui/section";

export function Services() {
  return (
    <Section id="dich-vu" soft>
      <SectionHeading
        eyebrow={services.eyebrow}
        title={services.title}
        subtitle={services.subtitle}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        {services.items.map((item, i) => (
          <Reveal key={item.title} delay={i * 80}>
            <Card className="h-full p-6 sm:p-7">
              <h3 className="text-lg font-bold text-fg">{item.title}</h3>
              {item.titleEn !== item.title && (
                <p className="mt-1 text-sm italic text-fg-subtle">{item.titleEn}</p>
              )}
              <p className="mt-4 text-sm leading-relaxed text-fg-muted">
                {item.note}
              </p>
              {/* Dịch vụ đã niêm yết giá thì đưa thẳng người đọc tới chỗ đặt
                  được; dịch vụ chưa có giá vẫn phải hỏi qua email. */}
              {item.link ? (
                <Link
                  href={item.link.href}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                >
                  {item.link.label}
                  <IconArrow size={15} />
                </Link>
              ) : (
                <a
                  href={composeEmailHref(`Hỏi về dịch vụ: ${item.title}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-sm font-bold text-primary hover:underline"
                >
                  {contact.email}
                </a>
              )}
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
