"use client";

import { useMemo, useState } from "react";
import type { Course } from "@/content/course";
import { trackCourseSort } from "@/lib/analytics";
import type { PublicAvailability } from "@/lib/course-availability";
import type { ReviewSummary } from "@/lib/reviews";
import { CourseCard } from "./course-card";

/**
 * `compare: null` keeps the authored order in content/course.ts, which runs the
 * courses in learning-path order — that ordering is editorial, so it stays the
 * default.
 */
const sorts = {
  default: { label: "Mặc định", compare: null },
  "price-desc": {
    label: "Giá cao → thấp",
    compare: (a: Course, b: Course) => b.price.vnd - a.price.vnd,
  },
  "price-asc": {
    label: "Giá thấp → cao",
    compare: (a: Course, b: Course) => a.price.vnd - b.price.vnd,
  },
} as const;

type SortKey = keyof typeof sorts;

export function CourseList({
  courses,
  summaries = {},
  availability,
}: {
  courses: Course[];
  /** Điểm trung bình đã duyệt, khóa theo slug. Rỗng khi chưa ai đánh giá. */
  summaries?: Record<string, ReviewSummary>;
  availability: Record<string, PublicAvailability> | null;
}) {
  const [sort, setSort] = useState<SortKey>("default");

  const shown = useMemo(() => {
    const compare = sorts[sort].compare;
    // Copy first: `courses` is the imported module array, and sorting in place
    // would rewrite the authored order for every other consumer.
    return compare ? [...courses].sort(compare) : courses;
  }, [courses, sort]);

  return (
    <>
      <div>
        <div className="mb-7 flex flex-wrap items-center">
          <span className="mr-2 text-sm font-semibold text-fg-muted">
            Sắp xếp
          </span>
          {(Object.keys(sorts) as SortKey[]).map((key) => {
            const active = key === sort;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  // Re-clicking the active pill is not a preference change.
                  if (key === sort) return;
                  setSort(key);
                  trackCourseSort(key);
                }}
                aria-pressed={active}
                className={`-ml-px inline-flex h-9 items-center border px-3.5 text-sm font-semibold transition-colors first-of-type:rounded-l-button last:rounded-r-button ${
                  active
                    ? "relative z-[1] border-rule bg-fg text-bg"
                    : "border-line bg-bg text-fg-muted hover:text-fg"
                }`}
              >
                {sorts[key].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Các thẻ khóa mang h3; h2 ẩn giữ cấp tiêu đề liền mạch từ h1 của trang. */}
      <h2 className="sr-only">Danh sách khóa học</h2>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((course) => (
          <div key={course.slug} className="h-full">
            <CourseCard
              course={course}
              summary={summaries[course.slug]}
              availability={
                availability
                  ? (availability[course.slug] ?? "not_open")
                  : undefined
              }
            />
          </div>
        ))}
      </div>
    </>
  );
}
