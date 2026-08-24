"use client";

import { useRef, useState } from "react";
import { cartModal } from "@/content/checkout";
import type { Course } from "@/content/course";
import { trackCourseModal, trackCta } from "@/lib/analytics";
import type { PublicAvailability } from "@/lib/course-sales";
import { formatDate } from "@/lib/format";
import type { PublicReview, ReviewSummary } from "@/lib/reviews";
import { useCart } from "./cart-provider";
import { CtaLink } from "./ui/cta-link";
import { Badge } from "./ui/badge";
import { Stars } from "./ui/stars";
import { IconArrow, IconCheck, IconClose, IconMessage } from "./ui/icons";

/** Running index of the first session in each phase, so numbering stays 1…8. */
function phaseOffset(phases: Course["phases"], index: number) {
  return phases
    .slice(0, index)
    .reduce((total, phase) => total + phase.sessions.length, 0);
}

/** Shared by the label above every phase and the heading inside the modal. */
function phaseKind(course: Course) {
  return course.curriculum === "modules" ? "Module" : "Giai đoạn";
}

export function CourseCard({
  course,
  summary,
  reviews = [],
  availability,
}: {
  course: Course;
  /** Vắng mặt khi khóa chưa có đánh giá nào được duyệt. */
  summary?: ReviewSummary;
  reviews?: PublicReview[];
  availability?: PublicAvailability;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const titleId = `${course.slug}-title`;
  const { openCart } = useCart();
  const publicState = availability ?? "not_open";
  const buyable = publicState === "buyable";
  const availabilityTone =
    publicState === "buyable" ? "success" : publicState === "full" ? "danger" : "cool";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          dialogRef.current?.showModal();
          // Opening a card is the strongest intent signal the page emits.
          trackCourseModal(course.slug);
        }}
        aria-haspopup="dialog"
        className="flex h-full w-full flex-col rounded-card border border-line bg-card p-6 text-left text-fg transition duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_10px_30px_-14px_rgba(12,73,143,0.25)] sm:p-7"
      >
        {/* The section heading is generic now that several courses share it, so
            every card has to name itself. */}
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
          {course.eyebrow}
        </p>
        <h3 className="mt-1.5 text-lg font-bold leading-snug tracking-tight">
          {course.title}
        </h3>
        <p className="mt-1.5 text-sm text-fg-muted">{course.audience}</p>

        {/* Khóa chưa có đánh giá nào được duyệt thì KHÔNG in gì cả. In "0 sao"
            hay "chưa có đánh giá" là tự đặt một con số 0 cạnh giá tiền — nó đọc
            như một điểm kém chứ không như một ô còn trống. */}
        {summary && (
          <span className="mt-3 inline-flex items-center gap-2">
            <Stars value={summary.average} />
            <span className="text-[13px] font-semibold text-fg-muted">
              {summary.average.toFixed(1)} · {summary.count} đánh giá
            </span>
          </span>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
            Học phí
          </p>
          <Badge tone={availabilityTone}>{cartModal.availability[publicState]}</Badge>
        </div>
        <p className="mt-1.5 text-2xl font-bold tracking-tight text-primary sm:text-3xl">
          {course.price.amount}
        </p>
        <p className="mt-1.5 text-sm text-fg-muted">{course.price.note}</p>

        <dl className="mt-6">
          {course.facts.map((fact) => (
            <div
              key={fact.label}
              className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-2.5 last:border-0"
            >
              <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                {fact.label}
              </dt>
              <dd className="text-[13px] font-semibold text-fg-muted">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* The roadmap itself lives in the modal; `mt-auto` pins this to the
            bottom so the affordance lines up across a row of uneven cards. */}
        <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-bold text-primary underline underline-offset-4">
          Xem lộ trình chi tiết
          <IconArrow size={15} />
        </span>
      </button>

      {/* Detail. Native <dialog> gives focus trapping, Esc-to-close, focus
          restore and top-layer stacking above the sticky header for free. */}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          // The ::backdrop forwards its clicks to the dialog element itself;
          // the padding lives on the inner wrapper so only backdrop hits match.
          if (e.target === dialogRef.current) dialogRef.current.close();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") dialogRef.current?.close();
        }}
        className="w-[calc(100vw-2rem)] max-w-2xl"
      >
        {open && <div>
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-card px-6 py-5 sm:px-7">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                {course.eyebrow}
              </p>
              <h3
                id={titleId}
                className="mt-1.5 text-xl font-bold tracking-tight text-primary sm:text-2xl"
              >
                {course.title}
              </h3>
              <p className="mt-1.5 text-sm text-fg-muted">{course.audience}</p>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Đóng"
              className="-mr-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-fg-muted transition hover:border-primary hover:text-primary"
            >
              <IconClose />
            </button>
          </div>

          <div className="px-6 py-6 sm:px-7">
            <p className="text-[15px] leading-relaxed text-fg-muted">
              {course.intro}
            </p>

            <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
              Nội dung khóa học
            </p>
            <div className="mt-4 space-y-6">
              {course.phases.map((phase, i) => {
                const byModule = course.curriculum === "modules";
                const offset = phaseOffset(course.phases, i);
                return (
                  <div key={phase.name}>
                    <h4 className="text-sm font-bold text-fg">
                      {phaseKind(course)} {i + 1}: {phase.name}
                    </h4>
                    <ol className="mt-2.5">
                      {phase.sessions.map((session, j) => (
                        <li
                          key={session}
                          className="flex gap-3.5 border-b border-line py-3 last:border-0"
                        >
                          {/* A module's topics carry a two-part number (1.1, 1.2);
                              a session carries the running class number. */}
                          <span
                            className={`mt-0.5 inline-flex h-6 shrink-0 items-center justify-center rounded-full bg-tint text-[11px] font-bold tabular-nums text-primary ${
                              byModule ? "px-2" : "w-6"
                            }`}
                          >
                            {byModule ? `${i + 1}.${j + 1}` : offset + j + 1}
                          </span>
                          <span className="text-[15px] leading-relaxed text-fg">
                            {!byModule && (
                              <span className="font-semibold">
                                Buổi {offset + j + 1}:{" "}
                              </span>
                            )}
                            {session}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              })}
            </div>

            <div className="mt-7 rounded-card border border-line bg-bg-soft p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                Thông tin học
              </p>
              <dl className="mt-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-2.5">
                  <dt className="text-[13px] text-fg-muted">Học phí</dt>
                  <dd className="text-[15px] font-bold text-fg">
                    {course.price.amount}
                    <span className="ml-2 text-[13px] font-semibold text-success">
                      {course.price.note}
                    </span>
                  </dd>
                </div>
                {course.facts.map((fact) => (
                  <div
                    key={fact.label}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-2.5 last:border-0"
                  >
                    <dt className="text-[13px] text-fg-muted">{fact.label}</dt>
                    <dd className="text-[15px] font-semibold text-fg">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
              Sau khóa học
            </p>
            <ul className="mt-3 space-y-3">
              {course.outcomes.map((outcome) => (
                <li
                  key={outcome}
                  className="flex gap-3 text-[15px] leading-relaxed text-fg-muted"
                >
                  <IconCheck
                    className="mt-0.5 shrink-0 text-success"
                    size={17}
                  />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>

            {reviews.length > 0 && (
              <>
                <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                  Học viên đánh giá
                </p>
                <ul className="mt-3 space-y-3">
                  {reviews.map((review) => (
                    <li
                      key={review.id}
                      className="rounded-card border border-line p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-bold text-fg">
                          {review.author}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Stars value={review.rating} size={14} />
                          <span className="text-xs text-fg-subtle">
                            {formatDate(new Date(review.createdAt))}
                          </span>
                        </span>
                      </div>
                      {review.comment && (
                        <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">
                          {review.comment}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* The label says "tư vấn", not "đăng ký khóa học": this link goes
                to the same free consultation form as the other six CTAs. A
                reader still weighing a 1.100.000đ course will not press a button
                that sounds like committing to pay. */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={!buyable}
                onClick={() => {
                  if (!buyable) return;
                  trackCta("khoa-hoc-modal", "dang-ky", course.slug);
                  dialogRef.current?.close();
                  openCart(course.slug);
                }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep disabled:cursor-not-allowed disabled:opacity-50"
              >
                Đăng ký học khóa này
                <IconArrow size={16} />
              </button>
              {/* Parallel route out for people who will never fill in a form —
                  with Zalo as the real consulting channel, that group is large. */}
              <CtaLink
                source="khoa-hoc-modal"
                target="zalo"
                course={course.slug}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
              >
                <IconMessage size={16} />
                Nhắn Zalo
              </CtaLink>
            </div>
            <p className="mt-3 text-center text-xs leading-relaxed text-fg-subtle">
              {course.registerNote}
            </p>
          </div>
        </div>}
      </dialog>
    </>
  );
}
