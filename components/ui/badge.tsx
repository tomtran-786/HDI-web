import type { ReactNode } from "react";

const toneClass = {
  cool: "bg-tint text-primary",
  success: "bg-tint text-success",
  warning: "bg-tint text-warning",
  danger: "bg-tint text-danger",
} as const;

/**
 * Chip trạng thái nhỏ — chỗ duy nhất còn dùng dạng viên thuốc. 12px là cỡ
 * nhỏ nhất của chữ chức năng trên site.
 */
export function Badge({
  children,
  tone = "cool",
}: {
  children: ReactNode;
  tone?: keyof typeof toneClass;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${toneClass[tone]}`}
    >
      {children}
    </span>
  );
}
