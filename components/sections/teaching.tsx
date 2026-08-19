import {
  supervisions,
  teachingInterests,
  teachingIntro,
  unitsTaught,
} from "@/content/teaching";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { Reveal } from "../ui/reveal";
import { Section, SectionHeading } from "../ui/section";

export function Teaching() {
  return (
    <Section id="giang-day">
      <SectionHeading
        eyebrow={teachingIntro.eyebrow}
        title={teachingIntro.title}
        subtitle={teachingIntro.subtitle}
      />

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Reveal>
          <Card className="h-full p-6 sm:p-7" hover={false}>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
              Luận án đã hướng dẫn
            </p>
            <ul className="mt-4 space-y-4">
              {supervisions.map((s) => (
                <li key={s.student} className="border-b border-line pb-4 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-fg">{s.student}</p>
                    <Badge tone={s.status === "ongoing" ? "success" : "cool"}>
                      {s.level} · {s.status === "ongoing" ? "đang hướng dẫn" : "đã hoàn thành"}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                    {s.thesis}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>

        <Reveal delay={90}>
          <div className="grid h-full gap-5">
            <Card className="p-6 sm:p-7" hover={false}>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                Lĩnh vực giảng dạy
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {teachingInterests.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            </Card>
            <Card className="p-6 sm:p-7" hover={false}>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                Học phần đã giảng dạy
              </p>
              <ul className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
                {unitsTaught.map((u) => (
                  <li key={u} className="text-sm text-fg-muted">
                    {u}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
