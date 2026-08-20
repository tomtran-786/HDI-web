"use client";

import { useRef } from "react";
import type { Course } from "@/content/course";
import { links } from "@/content/site";
import { IconArrow, IconCheck, IconClose } from "./ui/icons";

/** Running index of the first session in each phase, so numbering stays 1…8. */
function phaseOffset(phases: Course["phases"], index: number) {
  return phases
    .slice(0, index)
    .reduce((total, phase) => total + phase.sessions.length, 0);
}

export function CourseCard({ course }: { course: Course }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = `${course.slug}-title`;

  return (
    <>
      {/* Trigger. Filled with `primary` because --card and --bg are both white in
          light mode — a default card would vanish against this section. */}
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-haspopup="dialog"
        className="w-full rounded-card border border-primary-deep bg-primary p-6 text-left text-primary-fg transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-14px_rgba(12,73,143,0.35)] sm:p-7"
      >
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:gap-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">
              Học phí
            </p>
            <p className="mt-1.5 text-3xl font-bold tracking-tight sm:text-4xl">
              {course.price.amount}
            </p>
            <p className="mt-1.5 text-sm opacity-80">{course.price.note}</p>

            <dl className="mt-6">
              {course.facts.map((fact) => (
                <div
                  key={fact.label}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/20 py-2.5 last:border-0"
                >
                  <dt className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">
                    {fact.label}
                  </dt>
                  <dd className="text-[13px] font-semibold">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">
              Lộ trình
            </p>
            <ol className="mt-3 space-y-2.5">
              {course.phases.map((phase, i) => {
                const from = phaseOffset(course.phases, i) + 1;
                const to = from + phase.sessions.length - 1;
                return (
                  <li key={phase.name} className="flex items-baseline gap-3">
                    <span className="shrink-0 text-[11px] font-bold tabular-nums opacity-70">
                      Buổi {from}–{to}
                    </span>
                    <span className="text-[15px] font-semibold">
                      {phase.name}
                    </span>
                  </li>
                );
              })}
            </ol>

            <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold underline underline-offset-4">
              Xem lộ trình chi tiết
              <IconArrow size={15} />
            </span>
          </div>
        </div>
      </button>

      {/* Detail. Native <dialog> gives focus trapping, Esc-to-close, focus
          restore and top-layer stacking above the sticky header for free. */}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={(e) => {
          // The ::backdrop forwards its clicks to the dialog element itself;
          // the padding lives on the inner wrapper so only backdrop hits match.
          if (e.target === dialogRef.current) dialogRef.current.close();
        }}
        className="w-[calc(100vw-2rem)] max-w-2xl"
      >
        <div>
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
                const offset = phaseOffset(course.phases, i);
                return (
                  <div key={phase.name}>
                    <h4 className="text-sm font-bold text-fg">
                      Giai đoạn {i + 1}: {phase.name}
                    </h4>
                    <ol className="mt-2.5">
                      {phase.sessions.map((session, j) => (
                        <li
                          key={session}
                          className="flex gap-3.5 border-b border-line py-3 last:border-0"
                        >
                          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-tint text-[11px] font-bold tabular-nums text-primary">
                            {offset + j + 1}
                          </span>
                          <span className="text-[15px] leading-relaxed text-fg">
                            <span className="font-semibold">
                              Buổi {offset + j + 1}:
                            </span>{" "}
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

            <a
              href={links.register}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
            >
              Đăng ký khóa học
              <IconArrow size={16} />
            </a>
            <p className="mt-3 text-center text-xs leading-relaxed text-fg-subtle">
              {course.registerNote}
            </p>
          </div>
        </div>
      </dialog>
    </>
  );
}
