"use client";

import { trackCta, type CtaSource } from "@/lib/analytics";
import type { CourseSlug } from "@/content/course";
import { useCart } from "./cart-provider";
import { buttonClass } from "./ui/button";

/**
 * "Đăng ký" trên một dòng khóa: mở thẳng giỏ hàng của khóa đó, như nút ở chân
 * thẻ khóa. Chỉ render cho khóa đang bán — nơi gọi đã lọc trước.
 */
export function EnrollButton({
  slug,
  title,
  source,
  className = "",
}: {
  slug: CourseSlug;
  /** Tên khóa, để trình đọc màn hình phân biệt các nút "Đăng ký" trên cùng trang. */
  title: string;
  source: CtaSource;
  className?: string;
}) {
  const { openCart } = useCart();
  return (
    <button
      type="button"
      onClick={() => {
        trackCta(source, "dang-ky", slug);
        openCart(slug);
      }}
      className={buttonClass({ size: "sm", className })}
    >
      Đăng ký<span className="sr-only"> khóa {title}</span>
    </button>
  );
}
