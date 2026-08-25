"use client";

import type { CourseSlug } from "@/content/course";
import { trackCta } from "@/lib/analytics";
import { useCart } from "./cart-provider";
import { IconArrow } from "./ui/icons";

/** CTA Home tối giản: chỉ slug đi qua ranh giới server → client. */
export function OpenCourseEnrollButton({ slug }: { slug: CourseSlug }) {
  const { openCart } = useCart();

  return (
    <button
      type="button"
      onClick={() => {
        trackCta("home-open-courses", "dang-ky", slug);
        openCart(slug);
      }}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
    >
      Đăng ký ngay
      <IconArrow size={15} />
    </button>
  );
}
