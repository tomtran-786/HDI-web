"use client";

import Image from "next/image";
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
import { factValue } from "./course-facts";
import { CourseQuickView } from "./course-quick-view";
import { buttonClass } from "./ui/button";
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

const statusTone = {
  buyable: "text-success",
  full: "text-danger",
  not_open: "text-fg-subtle",
} as const;

/**
 * Logo phần mềm của khóa (SPSS, Stata…) khi bìa khóa là dạng logo — đặt nhỏ
 * cạnh trạng thái. Bìa ảnh chụp không hiện ở thẻ; bản đầy đủ nằm ở modal xem
 * nhanh và trang chi tiết.
 */
function CoverLogos({ course }: { course: Course }) {
  const { cover } = course;
  if (cover.kind !== "logos") return null;
  return (
    <span className="flex items-center gap-1.5">
      {cover.logos.map((logo) => (
        <Image
          key={logo.src}
          src={logo.src}
          alt={logo.alt}
          width={logo.width}
          height={logo.height}
          unoptimized={logo.src.endsWith(".svg")}
          sizes="64px"
          className="h-6 w-auto rounded-xs"
        />
      ))}
    </span>
  );
}

/**
 * Thẻ khóa dùng chung cho /khoa-hoc và "Khóa học khác" ở trang chi tiết: thẻ
 * chữ có viền (thẻ chỉ dành cho thứ mua được) — trạng thái và logo phần mềm,
 * tên khóa, một dòng meta (thời lượng | số học viên), mô tả hai dòng, hàng
 * giảng viên + đánh giá, chân thẻ học phí + "Đăng ký ngay". Trang chủ không
 * dùng thẻ này nữa: khóa đang mở nằm trong bảng chương trình ở hero.
 *
 * Bấm vào đâu trên thẻ cũng mở modal xem nhanh
 * (components/course-quick-view.tsx). Riêng nút chân thẻ: khóa đang bán thì
 * "Đăng ký ngay" vào thẳng giỏ; khóa chưa mở / hết chỗ không đăng ký được nên
 * nút là "Xem nhanh". Khóa `not_open` thì thẻ không render gì (xem bên dưới).
 * `cardPresentation` fail-open khi không đọc được database, như mọi nơi khác. Một
 * link phủ cả thẻ (`absolute inset-0`) trỏ thật tới trang chi tiết, nên
 * Ctrl/⌘-click, chuột giữa và crawler vẫn đi tới đó; click trơn thì mở modal.
 */
export function CourseCard({
  course,
  summary,
  availability,
  seatsLeft,
  ctaSource = "khoa-hoc-card",
}: {
  course: Course;
  /** Vắng mặt khi khóa chưa có đánh giá nào được duyệt. */
  summary?: ReviewSummary;
  availability?: PublicAvailability;
  /** Số chỗ còn lại thật — chỉ trang chủ có, vì chỉ ở đó thẻ được lọc theo ghế. */
  seatsLeft?: number;
  /** Nguồn của nút "Đăng ký ngay" cho analytics; trang chủ giữ nguồn cũ của nó. */
  ctaSource?: CtaSource;
}) {
  const [open, setOpen] = useState(false);
  const { openCart } = useCart();
  const { badge, buyable } = cardPresentation(availability);
  const duration = factValue(course, "Thời lượng");
  // Có số chỗ thật thì "Còn N chỗ" đã nói điều badge định nói.
  const status =
    seatsLeft !== undefined
      ? { label: `Còn ${seatsLeft} chỗ`, tone: "buyable" as const }
      : badge
        ? { label: cartModal.availability[badge], tone: badge }
        : null;

  function openQuickView() {
    setOpen(true);
    trackCourseQuickView(course.slug);
  }

  // Khóa chưa mở bán không được xuất hiện với người dùng cuối ở bất cứ đâu. Các
  // danh sách đã lọc trước (lib/course-availability.ts, `isListed`); dòng này
  // là chốt chặn cuối để một chỗ gọi quên lọc cũng không lộ thẻ ra.
  if (availability === "not_open") return null;

  return (
    <>
      <article className="group relative flex h-full flex-col rounded-card border border-line bg-card text-fg transition-colors duration-200 hover:border-rule">
        <Link
          href={`/khoa-hoc/${course.slug}`}
          onClick={(event) => {
            if (!isPlainClick(event)) return;
            event.preventDefault();
            openQuickView();
          }}
          className="absolute inset-0 z-[1] rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="sr-only">Xem nhanh khóa {course.title}</span>
        </Link>

        <div className="flex-1 px-5 pt-5 pb-4">
          <div className="flex min-h-6 items-center justify-between gap-3">
            {status ? (
              <span className={`text-sm font-semibold tabular-nums ${statusTone[status.tone]}`}>
                {status.label}
              </span>
            ) : (
              <span />
            )}
            <CoverLogos course={course} />
          </div>
          <h3 className="mt-3 line-clamp-3 text-xl leading-snug font-bold tracking-[-0.01em] group-hover:text-primary">
            {course.title}
          </h3>
          <p className="mt-2 text-sm text-fg-muted">
            {duration && (
              <>
                {duration}
                <span aria-hidden className="mx-1.5 text-line">
                  |
                </span>
              </>
            )}
            <span className="font-semibold tabular-nums text-fg">
              {formatCount(enrolledCount[course.slug])}
            </span>{" "}
            {enrolledLabel}
          </p>
          <p className="mt-3 line-clamp-2 text-[0.9375rem] leading-relaxed text-fg-muted">
            {course.audience}
          </p>
        </div>

        {course.instructor && (
          <div className="flex items-end justify-between gap-3 border-t border-line px-5 py-3">
            <div className="min-w-0">
              <p className="text-[0.8125rem] text-fg-subtle">Giảng viên</p>
              <p className="truncate text-sm font-semibold text-fg">
                {course.instructor.credential} {course.instructor.name}
              </p>
            </div>
            {summary && (
              <span className="flex shrink-0 flex-col items-end gap-1">
                <Stars value={summary.average} size={14} />
                <span className="text-[0.8125rem] font-semibold text-fg">
                  {summary.average.toFixed(1)}/5 sao
                </span>
              </span>
            )}
          </div>
        )}

        {/* Không wrap: nút luôn ở bên phải; giá ưu đãi tự xuống dòng điều kiện
            ngay dưới con số, vẫn đứng liền giá như quy ước của PriceTag. */}
        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
          <div className="min-w-0">
            <PriceTag price={course.price} size="sm" />
          </div>
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
            className={buttonClass({ size: "sm", className: "relative z-10 shrink-0" })}
          >
            {buyable ? "Đăng ký ngay" : "Xem nhanh"}
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
