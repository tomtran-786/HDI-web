import { services } from "@/content/services";
import { contact } from "@/content/site";
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
              <p className="mt-4 text-sm text-fg-muted">{item.note}</p>
              <a
                href={`mailto:${contact.email}`}
                className="mt-4 inline-block text-sm font-bold text-primary hover:underline"
              >
                {contact.email}
              </a>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
