import type { ReactNode } from "react";
import { Reveal } from "./reveal";

/** One page section. `soft` picks the alternate surface so sections alternate. */
export function Section({
  id,
  children,
  soft = false,
  className = "",
}: {
  id?: string;
  children: ReactNode;
  soft?: boolean;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-24 border-t border-line ${
        soft ? "bg-bg-soft" : "bg-bg"
      } text-fg ${className}`}
    >
      <div className="shell py-16 sm:py-20 lg:py-24">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  return (
    <Reveal
      className={`mb-10 sm:mb-12 ${align === "center" ? "text-center" : ""}`}
    >
      {eyebrow && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-3 max-w-2xl text-base text-fg-muted sm:text-lg ${
            align === "center" ? "mx-auto" : ""
          }`}
        >
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
