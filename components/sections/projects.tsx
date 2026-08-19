import { projects, projectsIntro } from "@/content/projects";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { Reveal } from "../ui/reveal";
import { Section, SectionHeading } from "../ui/section";

export function Projects() {
  return (
    <Section id="du-an">
      <SectionHeading
        eyebrow={projectsIntro.eyebrow}
        title={projectsIntro.title}
        subtitle={projectsIntro.subtitle}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {projects.map((p, i) => (
          <Reveal key={p.title} delay={i * 80}>
            <Card className="flex h-full flex-col p-6">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-primary">
                  {p.amount}
                </span>
                <span className="text-xs text-fg-subtle">{p.amountNote}</span>
              </div>
              <h3 className="mt-4 flex-1 text-[15px] font-semibold leading-snug text-fg">
                {p.title}
              </h3>
              <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
                <Row label="Đơn vị tài trợ" value={p.funder} />
                <Row label="Thời gian" value={`${p.duration} · năm ${p.fundedYear}`} />
              </dl>
              <div className="mt-4">
                <Badge>{p.role}</Badge>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
        {label}
      </dt>
      <dd className="mt-0.5 text-fg-muted">{value}</dd>
    </div>
  );
}
