"use client";

import Link from "next/link";
import { cartModal } from "@/content/checkout";
import type { Course } from "@/content/course";
import { trackCourseModal } from "@/lib/analytics";
import {
  cardPresentation,
  type PublicAvailability,
} from "@/lib/course-availability";
import type { ReviewSummary } from "@/lib/reviews";
import { Badge } from "./ui/badge";
import { EnrolledPill } from "./ui/enrolled-pill";
import { Stars } from "./ui/stars";
import { IconArrow } from "./ui/icons";

export function CourseCard({
  course,
  summary,
  availability,
}: {
  course: Course;
  /** Vắng mặt khi khóa chưa có đánh giá nào được duyệt. */
  summary?: ReviewSummary;
  availability?: PublicAvailability;
}) {
  const { badge } = cardPresentation(availability);
  const availabilityTone =
    badge === "buyable" ? "success" : badge === "full" ? "danger" : "cool";

  return (
    <Link
      href={`/khoa-hoc/${course.slug}`}
      onClick={() => {
        // Following a card opens the full roadmap on its own indexable page.
        trackCourseModal(course.slug);
      }}
      className="flex h-full w-full flex-col rounded-card border border-line bg-card p-6 text-left text-fg transition duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_10px_30px_-14px_rgba(12,73,143,0.25)] sm:p-7"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
        Mã khóa {course.code} · {course.eyebrow}
      </p>
      <h3 className="mt-1.5 text-lg font-bold leading-snug tracking-tight">
        {course.title}
      </h3>
      <p className="mt-1.5 text-sm text-fg-muted">{course.audience}</p>

      {summary && (
        <span className="mt-3 inline-flex items-center gap-2">
          <Stars value={summary.average} />
          <span className="text-[13px] font-semibold text-fg-muted">
            {summary.average.toFixed(1)} · {summary.count} đánh giá
          </span>
        </span>
      )}

      <div className="mt-4">
        <EnrolledPill slug={course.slug} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
          Học phí
        </p>
        {badge && (
          <Badge tone={availabilityTone}>{cartModal.availability[badge]}</Badge>
        )}
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

      <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-bold text-primary underline underline-offset-4">
        Xem lộ trình chi tiết
        <IconArrow size={15} />
      </span>
    </Link>
  );
}
