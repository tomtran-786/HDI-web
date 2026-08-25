"use client";

import Link from "next/link";
import { trackCourseModal } from "@/lib/analytics";
import { Card } from "./ui/card";
import { IconArrow } from "./ui/icons";

export type CourseTeaser = {
  slug: string;
  eyebrow: string;
  title: string;
  audience: string;
};

export function CourseTeaserCard({ course }: { course: CourseTeaser }) {
  return (
    <Card className="flex h-full flex-col p-6 sm:p-7">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
        {course.eyebrow}
      </p>
      <h3 className="mt-2 text-lg font-bold text-fg">{course.title}</h3>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-fg-muted">
        {course.audience}
      </p>
      <Link
        href={`/khoa-hoc/${course.slug}`}
        onClick={() => trackCourseModal(course.slug)}
        className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
      >
        Xem chi tiết
        <IconArrow size={15} />
      </Link>
    </Card>
  );
}
