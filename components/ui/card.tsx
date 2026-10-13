import type { ReactNode } from "react";

/** The bordered card used throughout the design reference. */
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
  const lift = hover
    ? "transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-14px_rgba(12,73,143,0.35)]"
    : "";

  return (
    <div id={id} className={`rounded-card border border-line bg-card ${lift} ${className}`}>
      {children}
    </div>
  );
}
