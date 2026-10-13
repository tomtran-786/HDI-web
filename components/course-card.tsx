"use client";

import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { cartModal } from "@/content/checkout";
import type { Course } from "@/content/course";
import { enrolledCount, enrolledLabel } from "@/content/course-hype";
import {
  trackCourseQuickView,
  trackCta,
  type CtaSource,
} from "@/lib/analytics";
import {
  cardPresentation,
  type PublicAvailability,
} from "@/lib/course-availability";
import { formatCount } from "@/lib/format";
import type { ReviewSummary } from "@/lib/reviews";
import { useCart } from "./cart-provider";
import { CourseCover } from "./course-cover";
import { factValue } from "./course-facts";
import { CourseQuickView } from "./course-quick-view";
import { Badge } from "./ui/badge";
import { IconArrow, IconCalendar } from "./ui/icons";
import { PriceTag } from "./ui/price-tag";
import { Stars } from "./ui/stars";

/** Click trái trơn — Ctrl/⌘/Shift/middle-click thì để trình duyệt mở link. */
function isPlainClick(event: MouseEvent) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

/**
 * Thẻ khóa dùng chung cho trang chủ ("Khóa học đang nhận học viên"), /khoa-hoc
 * và "Khóa học khác" ở trang chi tiết — theo thẻ "Other Popular Courses" của
 * theanalystacademy.com: ảnh bìa, dòng meta (thời lượng · số học viên), tên,
 * lịch học, đối tượng, hàng giảng viên + đánh giá, chân thẻ học phí + một nút.
 *
 * Bấm vào thẻ mở modal xem nhanh (components/course-quick-view.tsx). Cả thẻ
 * bấm được nhờ link tên khóa có `after:absolute after:inset-0` phủ lên thẻ
 * (stretched link) — không lồng nút trong `<a>`. Link vẫn trỏ thật tới trang
 * chi tiết, nên Ctrl/⌘-click, chuột giữa và crawler vẫn đi tới đó.
 *
 * Nút chân thẻ: khóa đang bán thì "Đăng ký ngay" (vào thẳng giỏ, như nút ở
 * thẻ trang chủ cũ); còn lại "Xem nhanh". `cardPresentation` fail-open khi
 * không đọc được database, giống mọi nơi khác.
 */
export function CourseCard({
  course,
  summary,
  availability,
  seatsLeft,
  ctaSource = "khoa-hoc-card",
  sizes = "(min-width: 1280px) 24rem, (min-width: 768px) 50vw, 100vw",
}: {
  course: Course;
  /** Vắng mặt khi khóa chưa có đánh giá nào được duyệt. */
  summary?: ReviewSummary;
  availability?: PublicAvailability;
  /** Số chỗ còn lại thật — chỉ trang chủ có, vì chỉ ở đó thẻ được lọc theo ghế. */
  seatsLeft?: number;
  /** Nguồn của nút "Đăng ký ngay" cho analytics; trang chủ giữ nguồn cũ của nó. */
  ctaSource?: CtaSource;
  sizes?: string;
}) {
  const [open, setOpen] = useState(false);
  const { openCart } = useCart();
  const { badge, buyable } = cardPresentation(availability);
  const availabilityTone =
    badge === "buyable" ? "success" : badge === "full" ? "danger" : "cool";
  const duration = factValue(course, "Thời lượng");
  const schedule = factValue(course, "Lịch học");

  function openQuickView() {
    setOpen(true);
    trackCourseQuickView(course.slug);
  }

  return (
    <>
      <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-card text-fg transition duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_10px_30px_-14px_rgba(12,73,143,0.35)]">
        <div className="relative">
          <CourseCover cover={course.cover} variant="card" sizes={sizes} />
          {(badge || seatsLeft !== undefined) && (
            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
              {/* Có số chỗ thật thì "Còn N chỗ" đã nói điều badge định nói. */}
              {badge && seatsLeft === undefined && (
                <Badge tone={availabilityTone}>
                  {cartModal.availability[badge]}
                </Badge>
              )}
              {seatsLeft !== undefined && (
                <span className="inline-flex items-center rounded-full bg-tint px-2.5 py-1 text-[11px] font-bold leading-none tabular-nums text-success">
                  Còn {seatsLeft} chỗ
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col px-5 pt-5">
          <p className="text-xs font-semibold text-primary">
            {duration && <>{duration} · </>}
            <span className="font-bold tabular-nums text-primary">
              {formatCount(enrolledCount[course.slug])}
            </span>{" "}
            {enrolledLabel}
          </p>
          <h3 className="mt-2 text-lg font-bold leading-snug text-fg">
            <Link
              href={`/khoa-hoc/${course.slug}`}
              onClick={(event) => {
                if (!isPlainClick(event)) return;
                event.preventDefault();
                openQuickView();
              }}
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-card focus-visible:after:ring-2 focus-visible:after:ring-primary"
            >
              {course.title}
            </Link>
          </h3>
          {schedule && (
            <p className="mt-2 flex gap-2 text-sm font-semibold text-fg">
              <IconCalendar className="mt-0.5 shrink-0 text-primary" size={16} />
              <span>{schedule}</span>
            </p>
          )}
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-fg-muted">
            {course.audience}
          </p>
        </div>

        {course.instructor && (
          <div className="mx-5 mt-5 flex items-end justify-between gap-3 border-t border-line py-3">
            <div className="min-w-0">
              <p className="text-[11px] text-fg-subtle">Giảng viên</p>
              <p className="truncate text-sm font-bold text-primary">
                {course.instructor.credential} {course.instructor.name}
              </p>
            </div>
            {summary && (
              <span className="flex shrink-0 flex-col items-end gap-0.5">
                <Stars value={summary.average} size={13} />
                <span className="text-xs font-semibold text-fg-muted">
                  {summary.average.toFixed(1)}/5 · {summary.count} đánh giá
                </span>
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
          <PriceTag price={course.price} size="sm" />
          <button
            type="button"
            onClick={() => {
              if (buyable) {
                trackCta(ctaSource, "dang-ky", course.slug);
                openCart(course.slug);
              } else {
                openQuickView();
              }
            }}
            className="relative z-10 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
          >
            {buyable ? "Đăng ký ngay" : "Xem nhanh"}
            <IconArrow size={14} />
          </button>
        </div>
      </article>

      {open && (
        <CourseQuickView
          course={course}
          availability={availability}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
