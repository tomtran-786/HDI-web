import { stats } from "@/content/stats";
import { Reveal } from "../ui/reveal";
import { Section } from "../ui/section";

/**
 * A standalone band, not a hero appendage: it used to carry bottom padding
 * only, which left it floating without a top edge once other sections moved
 * around it. `Section` gives it the same rule and rhythm as every other band.
 */
export function Stats() {
  return (
    <Section>
      <Reveal>
        <dl className="grid grid-cols-2 divide-x divide-line rounded-card border border-line bg-card lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="border-b border-line px-6 py-8 text-center last:border-b-0 sm:border-b-0 [&:nth-child(-n+2)]:border-b lg:[&:nth-child(-n+2)]:border-b-0"
            >
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <span className="block text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                  {s.value}
                </span>
                <span className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-subtle">
                  {s.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </Section>
  );
}
