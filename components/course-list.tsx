"use client";

import { useMemo, useState } from "react";
import type { Course } from "@/content/course";
import { trackCourseSort } from "@/lib/analytics";
import { CourseCard } from "./course-card";
import { Reveal } from "./ui/reveal";

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

export function CourseList({ courses }: { courses: Course[] }) {
  const [sort, setSort] = useState<SortKey>("default");

  const shown = useMemo(() => {
    const compare = sorts[sort].compare;
    // Copy first: `courses` is the imported module array, and sorting in place
    // would rewrite the authored order for every other consumer.
    return compare ? [...courses].sort(compare) : courses;
  }, [courses, sort]);

  return (
    <>
      <Reveal>
        <div className="mb-7 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
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
                className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-primary text-primary-fg"
                    : "border border-line bg-card text-fg-muted hover:border-primary hover:text-primary"
                }`}
              >
                {sorts[key].label}
              </button>
            );
          })}
        </div>
      </Reveal>

      <div className="grid gap-5 md:grid-cols-2">
        {shown.map((course, i) => (
          <Reveal key={course.slug} delay={110 + i * 70} className="h-full">
            <CourseCard course={course} />
          </Reveal>
        ))}
      </div>
    </>
  );
}
