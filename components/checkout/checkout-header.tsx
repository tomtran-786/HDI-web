import Link from "next/link";
import type { ReactNode } from "react";

export type CheckoutCrumb = { label: string; href: string };

/**
 * Đầu trang phẳng của giỏ hàng và các trang thanh toán: `Trang chủ › Giỏ hàng`
 * trên một hàng, tiêu đề trang chính là mục cuối của breadcrumb (cỡ 22px, đậm),
 * còn `aside` ("3 khóa", "Đơn #…") nằm sát phải. Thay cho hero `PageBackdrop`;
 * vì nó tự mang breadcrumb nên breadcrumb toàn cục bỏ qua các trang này
 * (components/site-breadcrumbs.tsx).
 */
export function CheckoutHeader({
  trail,
  title,
  aside,
}: {
  trail: CheckoutCrumb[];
  title: string;
  aside?: ReactNode;
}) {
  return (
    <header className="border-b border-line bg-bg">
      <div className="shell flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-5">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-fg-muted">
            {trail.map((crumb) => (
              <li key={crumb.href} className="flex items-baseline gap-2">
                <Link
                  href={crumb.href}
                  className="transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {crumb.label}
                </Link>
                <span aria-hidden>›</span>
              </li>
            ))}
            <li>
              <h1 className="text-[22px] font-bold leading-tight tracking-tight text-fg">
                {title}
              </h1>
            </li>
          </ol>
        </nav>
        {aside && (
          <p className="text-sm font-semibold tabular-nums text-fg-muted">{aside}</p>
        )}
      </div>
    </header>
  );
}
