"use client";

import { useMemo, useState } from "react";
import {
  publications,
  publicationsIntro,
  publicationYears,
} from "@/content/publications";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { Reveal } from "../ui/reveal";
import { Section, SectionHeading } from "../ui/section";

export function Publications() {
  const [year, setYear] = useState<number | "all">("all");

  const shown = useMemo(
    () => (year === "all" ? publications : publications.filter((p) => p.year === year)),
    [year],
  );

  const filters: { key: number | "all"; label: string; count: number }[] = [
    { key: "all", label: "Tất cả", count: publications.length },
    ...publicationYears.map((y) => ({
      key: y as number | "all",
      label: String(y),
      count: publications.filter((p) => p.year === y).length,
    })),
  ];

  return (
    <Section id="cong-bo" soft>
      <SectionHeading
        eyebrow={publicationsIntro.eyebrow}
        title={publicationsIntro.title}
        subtitle={publicationsIntro.subtitle}
      />

      <Reveal>
        <div className="mb-7 flex flex-wrap gap-2">
          {filters.map((f) => {
            const active = f.key === year;
            return (
              <button
                key={String(f.key)}
                type="button"
                onClick={() => setYear(f.key)}
                aria-pressed={active}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-primary text-primary-fg"
                    : "border border-line bg-card text-fg-muted hover:border-primary hover:text-primary"
                }`}
              >
                {f.label}
                <span
                  className={`text-[11px] ${active ? "opacity-70" : "text-fg-subtle"}`}
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>
      </Reveal>

      <ol className="space-y-4">
        {shown.map((p, i) => (
          <Reveal key={p.title} delay={Math.min(i, 6) * 45}>
            <Card className="p-6" hover={false}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-bold text-primary">{p.year}</span>
                {p.status && <Badge tone="success">{p.status}</Badge>}
              </div>
              <h3 className="mt-2 text-[17px] font-semibold leading-snug text-fg">
                {p.title}
              </h3>
              <p className="mt-2 text-sm text-fg-muted">{p.authors}</p>
              <p className="mt-1 text-sm italic text-fg-subtle">{p.venue}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {p.metrics.map((m) => (
                  <Badge key={m}>{m}</Badge>
                ))}
                {p.doi && (
                  <a
                    href={`https://doi.org/${p.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    DOI: {p.doi} ↗
                  </a>
                )}
              </div>
            </Card>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
