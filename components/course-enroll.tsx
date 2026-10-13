"use client";

import type { Course } from "@/content/course";
import { trackCta, type CtaSource } from "@/lib/analytics";
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
  layout = "row",
  source = "khoa-hoc-detail",
}: {
  course: Course;
  availability?: PublicAvailability;
  className?: string;
  /**
   * `row`   — hai nút cạnh nhau từ `sm` (mặc định).
   * `stack` — xếp dọc, nút đầy bề ngang: card học phí hẹp ở đầu trang chi tiết.
   * `pills` — hai pill nhỏ vừa chữ, nằm cùng hàng: modal xem nhanh.
   */
  layout?: "row" | "stack" | "pills";
  /** Nơi đặt cụm nút, cho analytics: trang chi tiết hay modal xem nhanh. */
  source?: CtaSource;
}) {
  const { openCart } = useCart();
  const { buyable } = cardPresentation(availability);
  const pills = layout === "pills";
  const size = pills ? "px-3.5 py-2" : "px-6 py-3";

  return (
    <div
      className={`flex ${
        pills
          ? "flex-wrap items-center gap-2"
          : `flex-col gap-3 ${layout === "row" ? "sm:flex-row" : ""}`
      } ${className}`}
    >
      {buyable && (
        <button
          type="button"
          onClick={() => {
            trackCta(source, "dang-ky", course.slug);
            openCart(course.slug);
          }}
          className={`inline-flex items-center justify-center gap-2 rounded-full bg-primary ${size} text-sm font-bold text-primary-fg transition hover:bg-primary-deep ${
            pills ? "" : "flex-1"
          }`}
        >
          {pills ? "Đăng ký ngay" : "Đăng ký học khóa này"}
          <IconArrow size={pills ? 14 : 16} />
        </button>
      )}
      <CtaLink
        source={source}
        target="zalo"
        course={course.slug}
        className={`inline-flex items-center justify-center gap-2 rounded-full border border-line ${size} text-sm font-bold text-fg transition hover:border-primary hover:text-primary`}
      >
        <IconMessage size={pills ? 14 : 16} />
        Nhắn Zalo
      </CtaLink>
    </div>
  );
}
