import type { ReactNode } from "react";
import { CornerRings } from "./corner-rings";
import { Notation } from "./notation";
import { Reveal } from "./reveal";

type SectionTone = "plain" | "soft" | "band";

/**
 * One page section. `tone` picks the surface: `plain`, `soft` (the alternate
 * radial wash) or `band` (a navy band with corner rings). `soft` stays as a
 * boolean alias so the existing call sites don't change.
 */
export function Section({
  id,
  children,
  soft = false,
  tone,
  className = "",
}: {
  id?: string;
  children: ReactNode;
  soft?: boolean;
  tone?: SectionTone;
  className?: string;
}) {
  const resolved: SectionTone = tone ?? (soft ? "soft" : "plain");

  if (resolved === "band") {
    return (
      <section
        id={id}
        className={`band relative isolate scroll-mt-24 overflow-hidden ${className}`}
      >
        <CornerRings />
        <div className="shell relative py-16 sm:py-20 lg:py-24">{children}</div>
      </section>
    );
  }

  return (
    <section
      id={id}
      className={`scroll-mt-24 border-t border-line ${
        resolved === "soft" ? "bg-bg-soft" : "bg-bg"
      } text-fg ${className}`}
    >
      <div className="shell py-16 sm:py-20 lg:py-24">{children}</div>
    </section>
  );
}

export interface HeadingMark {
  /** Cụm chữ được nhấn — phải là chuỗi con của `title`. */
  text: string;
  type?: "underline" | "circle";
}

/** Tách `title` tại `mark.text`; trả về null nếu không khớp (title vẫn render). */
export function splitTitleAtMark(title: string, mark: HeadingMark) {
  const index = title.indexOf(mark.text);
  if (!mark.text || index === -1) return null;
  return {
    before: title.slice(0, index),
    marked: mark.text,
    after: title.slice(index + mark.text.length),
  };
}

function MarkedTitle({ title, mark }: { title: string; mark?: HeadingMark }) {
  if (!mark) return <>{title}</>;
  const parts = splitTitleAtMark(title, mark);
  if (!parts) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `SectionHeading: mark "${mark.text}" không nằm trong title "${title}"`,
      );
    }
    return <>{title}</>;
  }
  return (
    <>
      {parts.before}
      <Notation type={mark.type ?? "underline"}>{parts.marked}</Notation>
      {parts.after}
    </>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  mark,
  onBand = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  /** Một cụm trong `title` được gạch chân / khoanh tròn bằng nét vẽ tay. */
  mark?: HeadingMark;
  /** Tiêu đề nằm trên band navy: h2 trắng, eyebrow màu accent. */
  onBand?: boolean;
}) {
  return (
    <Reveal
      className={`mb-10 sm:mb-12 ${align === "center" ? "text-center" : ""}`}
    >
      {eyebrow && (
        <p
          className={`mb-3 text-xs font-semibold uppercase tracking-[0.18em] ${
            onBand ? "text-accent-on-band" : "text-fg-muted"
          }`}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={`text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1] ${
          onBand ? "text-white" : "text-primary"
        }`}
      >
        <MarkedTitle title={title} mark={mark} />
      </h2>
      {subtitle && (
        <p
          className={`mt-3 max-w-2xl text-base sm:text-lg ${
            onBand ? "text-white/75" : "text-fg-muted"
          } ${align === "center" ? "mx-auto" : ""}`}
        >
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
