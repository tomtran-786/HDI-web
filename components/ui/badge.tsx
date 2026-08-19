import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "cool",
}: {
  children: ReactNode;
  tone?: "cool" | "success";
}) {
  const styles =
    tone === "success" ? "bg-tint text-success" : "bg-tint text-primary";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${styles}`}
    >
      {children}
    </span>
  );
}
