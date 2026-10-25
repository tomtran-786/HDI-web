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
import { IconArrow } from "./ui/icons";
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
  buyable: "bg-white/90 text-[#1c7a4d]",
  full: "bg-white/90 text-[#b3261e]",
  not_open: "bg-white/15 text-white",
} as const;

/**
 * Banner xanh đậm mang tên khóa — như ảnh bìa thẻ khóa của
 * theanalystacademy.com. Màu cố định, không theo token sáng/tối: banner là
 * một khối thương hiệu, chữ trắng trên nền xanh đậm phải đọc được ở cả hai
 * giao diện.
 *
 * Ảnh bìa riêng của từng khóa (content/course.ts `cover`) vẫn có mặt: ảnh chụp
 * (hoặc ảnh nền của panel logo) thành lớp nền mờ dưới màu xanh, còn logo thì
 * thành một hàng logo nhỏ trên tên khóa. Bản đầy đủ của ảnh nằm ở modal và trang chi tiết.
 */
function CourseBanner({
  course,
  status,
  sizes,
}: {
  course: Course;
  status: { label: string; tone: keyof typeof statusTone } | null;
  sizes: string;
}) {
  const { cover } = course;

  return (
    <div className="relative isolate flex aspect-[16/9] flex-col justify-between overflow-hidden bg-[#0b315e] p-5 text-white">
      <Image
        src={cover.kind === "photo" ? cover.src : cover.background.src}
        alt=""
        fill
        sizes={sizes}
        className="-z-10 object-cover opacity-25 mix-blend-luminosity"
      />
      {/* Ba dải chéo ở góc phải trên, chỉ để trang trí. */}
      <span aria-hidden className="absolute -right-10 -top-12 -z-10 h-40 w-16 rotate-[35deg] bg-white/10" />
      <span aria-hidden className="absolute -right-2 -top-16 -z-10 h-44 w-10 rotate-[35deg] bg-[#6aabee]/35" />
      <span aria-hidden className="absolute right-16 -top-20 -z-10 h-40 w-6 rotate-[35deg] bg-white/5" />

      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-wide text-white/90">
          <Image
            src="/images/logo-mark.png"
            alt=""
            width={20}
            height={20}
            className="h-5 w-5 rounded"
          />
          HDI Research Center
        </span>
        {status && (
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-bold leading-none tabular-nums ${statusTone[status.tone]}`}
          >
            {status.label}
          </span>
        )}
      </div>

      <div>
        {cover.kind === "logos" && (
          <div className="mb-2.5 flex items-center gap-1.5">
            {cover.logos.map((logo) => (
              <span
                key={logo.src}
                className={`flex h-8 items-center rounded-md ${logo.tile ? "" : "bg-white px-2"}`}
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.width}
                  height={logo.height}
                  unoptimized={logo.src.endsWith(".svg")}
                  sizes="96px"
                  className={`w-auto ${logo.tile ? "h-8 rounded-md" : "h-5"}`}
                />
              </span>
            ))}
            {cover.extra && (
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-bold">
                {cover.extra}
              </span>
            )}
          </div>
        )}
        <h3 className="line-clamp-3 text-xl font-bold leading-snug tracking-tight">
          {course.title}
        </h3>
      </div>
    </div>
  );
}

/**
 * Thẻ khóa dùng chung cho trang chủ ("Khóa học đang nhận học viên"), /khoa-hoc
 * và "Khóa học khác" — theo thẻ khóa của theanalystacademy.com: banner mang tên
 * khóa, một dòng meta (thời lượng | số học viên), mô tả hai dòng, hàng giảng
 * viên + đánh giá, chân thẻ học phí + "Đăng ký ngay".
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
      <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-card text-fg shadow-[0_12px_18px_-6px_rgba(0,0,0,0.12)] transition duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_16px_30px_-12px_rgba(12,73,143,0.35)]">
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

        <CourseBanner course={course} status={status} sizes={sizes} />

        <div className="flex-1 px-5 py-4">
          <p className="text-[13px] font-semibold text-primary">
            {duration && (
              <>
                {duration}
                <span aria-hidden className="mx-1.5 text-line">
                  |
                </span>
              </>
            )}
            <span className="font-bold tabular-nums text-primary">
              {formatCount(enrolledCount[course.slug])}
            </span>{" "}
            {enrolledLabel}
          </p>
          <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-fg">
            {course.audience}
          </p>
        </div>

        {course.instructor && (
          <div className="flex items-end justify-between gap-3 border-t border-line px-5 py-3">
            <div className="min-w-0">
              <p className="text-[13px] text-fg-muted">Giảng viên</p>
              <p className="truncate text-sm font-bold text-primary">
                {course.instructor.credential} {course.instructor.name}
              </p>
            </div>
            {summary && (
              <span className="flex shrink-0 flex-col items-end gap-1">
                <Stars value={summary.average} size={14} />
                <span className="text-[13px] font-bold text-fg">
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
