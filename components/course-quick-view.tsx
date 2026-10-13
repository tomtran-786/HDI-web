"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { cartModal } from "@/content/checkout";
import type { Course } from "@/content/course";
import { trackCourseModal } from "@/lib/analytics";
import {
  cardPresentation,
  type PublicAvailability,
} from "@/lib/course-availability";
import { CourseCover } from "./course-cover";
import { CourseEnroll } from "./course-enroll";
import { CourseFactList } from "./course-facts";
import { phaseKind, phaseMeta } from "./course-roadmap";
import { Badge } from "./ui/badge";
import { CheckDot } from "./ui/check-dot";
import { IconArrow, IconClose } from "./ui/icons";
import { PriceTag } from "./ui/price-tag";

/** Số kết quả đạt được in trong modal; bản đầy đủ nằm ở trang chi tiết. */
const OUTCOME_PREVIEW = 4;

/**
 * Modal xem nhanh mở từ thẻ khóa (components/course-card.tsx) — bản thu nhỏ
 * của đầu trang chi tiết: bên trái là khóa học dạy gì, bên phải là cần biết gì
 * để đăng ký. Chỉ in tên module, không in chủ đề con; ai cần giáo trình đầy đủ
 * thì đi tiếp sang trang chi tiết bằng link ở cuối cột phải.
 *
 * `<dialog>` gốc theo đúng mẫu components/feedback-modal.tsx: Esc và focus trap
 * là của trình duyệt, còn khóa cuộn nền và ẩn nút liên hệ nổi đã có sẵn trong
 * app/globals.css (`html:has(dialog[open])`).
 */
export function CourseQuickView({
  course,
  availability,
  onClose,
}: {
  course: Course;
  availability?: PublicAvailability;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { badge } = cardPresentation(availability);
  const availabilityTone =
    badge === "buyable" ? "success" : badge === "full" ? "danger" : "cool";
  const titleId = `quick-view-${course.slug}`;
  const outcomes = course.outcomes.slice(0, OUTCOME_PREVIEW);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="w-[calc(100vw-1.5rem)] max-w-4xl sm:w-[calc(100vw-2rem)]"
    >
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-card px-5 py-4 sm:px-7">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
            Mã khóa {course.code} · {course.eyebrow}
          </p>
          <h2
            id={titleId}
            className="mt-1 text-xl font-bold leading-snug tracking-tight text-primary sm:text-2xl"
          >
            {course.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng xem nhanh"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-fg-muted transition hover:border-primary hover:text-primary"
        >
          <IconClose />
        </button>
      </div>

      {/* Ba khối A (ảnh + đối tượng), B (học phí), C (kết quả + lộ trình).
          Desktop: A trên C ở cột trái, B dính ở cột phải. Mobile xếp A → B → C,
          để nút đăng ký không bị đẩy xuống dưới cả lộ trình. */}
      <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[minmax(0,1fr)_19rem] md:grid-rows-[auto_1fr]">
        <div className="min-w-0 md:col-start-1 md:row-start-1">
          <CourseCover
            cover={course.cover}
            variant="hero"
            sizes="(min-width: 768px) 32rem, 100vw"
            // Thứ đầu tiên người ta thấy khi modal mở: lazy thì khung trống
            // một nhịp, dù modal chỉ mount sau khi bấm.
            eager
          />
          <p className="mt-5 text-[15px] leading-relaxed text-fg-muted">
            {course.audience}
          </p>
        </div>

        <div className="md:sticky md:top-24 md:col-start-2 md:row-span-2 md:row-start-1 md:self-start">
          <div className="rounded-card border border-line bg-bg-soft p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
              Khóa học gồm
            </p>
            <CourseFactList course={course} className="mt-3" />

            <div className="mt-5 border-t border-line pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                  Học phí
                </p>
                {badge && (
                  <Badge tone={availabilityTone}>
                    {cartModal.availability[badge]}
                  </Badge>
                )}
              </div>
              <div className="mt-2">
                <PriceTag price={course.price} />
              </div>
              <p className="mt-2 text-sm font-semibold text-success">
                {course.price.note}
              </p>
              <CourseEnroll
                course={course}
                availability={availability}
                className="mt-4"
                source="khoa-hoc-modal"
                stacked
              />
            </div>
          </div>

          <Link
            href={`/khoa-hoc/${course.slug}`}
            onClick={() => {
              trackCourseModal(course.slug);
              // Đóng trước khi điều hướng: từ "Khóa học khác" sang trang của
              // một khóa khác, thẻ chứa modal có thể được React giữ lại.
              onClose();
            }}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 text-sm font-bold text-primary underline underline-offset-4 hover:text-primary-deep"
          >
            Xem trang chi tiết
            <IconArrow size={15} />
          </Link>
        </div>
        <div className="min-w-0 md:col-start-1 md:row-start-2">
          <h3 className="text-base font-bold text-primary">
            Sau khóa học, bạn có thể
          </h3>
          <ul className="mt-3 space-y-3">
            {outcomes.map((outcome) => (
              <li
                key={outcome}
                className="flex gap-3 text-sm leading-relaxed text-fg-muted"
              >
                <CheckDot />
                <span>{outcome}</span>
              </li>
            ))}
          </ul>

          <h3 className="mt-6 text-base font-bold text-primary">Lộ trình</h3>
          <ol className="mt-3 divide-y divide-line rounded-card border border-line">
            {course.phases.map((phase, i) => (
              <li
                key={phase.name}
                className="flex items-baseline justify-between gap-4 px-4 py-3"
              >
                <span className="text-sm font-semibold leading-snug text-fg">
                  {phaseKind(course)} {i + 1}: {phase.name}
                </span>
                <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
                  {phaseMeta(course, i)}
                </span>
              </li>
            ))}
          </ol>
        </div>

      </div>
    </dialog>
  );
}
