import type { ReactNode } from "react";

const toneClass = {
  cool: "bg-tint text-primary",
  success: "bg-tint text-success",
  warning: "bg-tint text-warning",
  danger: "bg-tint text-danger",
} as const;

export function Badge({
  children,
  tone = "cool",
}: {
  children: ReactNode;
  tone?: keyof typeof toneClass;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${toneClass[tone]}`}
    >
      {children}
    </span>
  );
}
