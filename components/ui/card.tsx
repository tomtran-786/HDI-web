import type { ReactNode } from "react";

/**
 * A ruled box for things a visitor can click or buy. Content that is only read
 * sits directly on the page instead, separated by rules and whitespace.
 *
 * Elevation is declared once — a 1px border, no shadow. Hover darkens the
 * border to the ink colour rather than lifting the box.
 */
export function Card({
  children,
  className = "",
  hover = true,
  id,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  id?: string;
}) {
  const hoverClass = hover ? "transition-colors duration-200 hover:border-rule" : "";

  return (
    <div id={id} className={`rounded-card border border-line bg-card ${hoverClass} ${className}`}>
      {children}
    </div>
  );
}
