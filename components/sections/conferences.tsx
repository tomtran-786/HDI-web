"use client";

import { useState } from "react";
import { conferences, conferencesIntro } from "@/content/conferences";
import { Badge } from "../ui/badge";
import { Section, SectionHeading } from "../ui/section";

const INITIAL = 6;

export function Conferences() {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? conferences : conferences.slice(0, INITIAL);
  const hidden = conferences.length - INITIAL;

  return (
    <Section id="hoi-thao" soft>
      <SectionHeading
        eyebrow={conferencesIntro.eyebrow}
        title={conferencesIntro.title}
        subtitle={conferencesIntro.subtitle}
      />

      <ol className="rounded-card border border-line bg-card">
        {shown.map((c, i) => (
          <li
            key={c.name}
            className="grid gap-2 border-b border-line px-6 py-5 last:border-0 sm:grid-cols-[auto_1fr_auto] sm:items-baseline sm:gap-5"
          >
            <span className="text-sm font-bold tabular-nums text-fg-subtle">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="text-[15px] font-semibold leading-snug text-fg">
                {c.name}
              </p>
              <p className="mt-1 text-sm text-fg-muted">
                {c.where} · {c.when}
              </p>
            </div>
            <div className="sm:text-right">
              <Badge>{c.role}</Badge>
            </div>
          </li>
        ))}
      </ol>

      {hidden > 0 && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-full border border-line bg-card px-6 py-2.5 text-sm font-bold text-fg-muted transition hover:border-primary hover:text-primary"
          >
            {expanded ? "Thu gọn" : `Xem thêm ${hidden} hội thảo`}
          </button>
        </div>
      )}
    </Section>
  );
}
