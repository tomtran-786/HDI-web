import type { ReactNode } from "react";

/**
 * Link ra trang ngoài, mở tab mới. Luôn có gạch chân để không phân biệt link
 * chỉ bằng màu (WCAG 1.4.1); màu chữ và màu gạch do `className` quyết định.
 */
export function ExternalLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`underline underline-offset-2 transition-colors ${className}`}
    >
      {children}
      <span aria-hidden> ↗</span>
      <span className="sr-only"> (mở tab mới)</span>
    </a>
  );
}
