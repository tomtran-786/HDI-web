"use client";

import type { Course } from "@/content/course";
import { trackCta } from "@/lib/analytics";
import {
  cardPresentation,
  type PublicAvailability,
} from "@/lib/course-availability";
import { useCart } from "./cart-provider";
import { CtaLink } from "./ui/cta-link";
import { IconArrow, IconMessage } from "./ui/icons";

export function CourseEnroll({
  course,
  availability,
  className = "",
}: {
  course: Course;
  availability?: PublicAvailability;
  className?: string;
}) {
  const { openCart } = useCart();
  const { buyable } = cardPresentation(availability);

  return (
    <div className={`flex flex-col gap-3 sm:flex-row ${className}`}>
      {buyable && (
        <button
          type="button"
          onClick={() => {
            trackCta("khoa-hoc-detail", "dang-ky", course.slug);
            openCart(course.slug);
          }}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
        >
          Đăng ký học khóa này
          <IconArrow size={16} />
        </button>
      )}
      <CtaLink
        source="khoa-hoc-detail"
        target="zalo"
        course={course.slug}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
      >
        <IconMessage size={16} />
        Nhắn Zalo
      </CtaLink>
    </div>
  );
}
