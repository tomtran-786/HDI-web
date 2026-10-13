import type { Course, FactLabel } from "@/content/course";
import {
  IconCalendar,
  IconClock,
  IconFolder,
  IconPlay,
  IconUsers,
  IconVideo,
} from "./ui/icons";

const factIcons: Record<FactLabel, typeof IconVideo> = {
  "Hình thức": IconVideo,
  "Thời lượng": IconClock,
  "Lịch học": IconCalendar,
  "Sĩ số": IconUsers,
  "Học liệu": IconFolder,
  "Xem lại": IconPlay,
};

/** Đọc một ô `facts` theo nhãn; `undefined` khi khóa không có ô đó. */
export function factValue(course: Course, label: FactLabel) {
  return course.facts.find((fact) => fact.label === label)?.value;
}

/**
 * Sáu dòng `facts` có icon, nhãn và giá trị trên cùng một dòng — khối "Khóa học
 * gồm" ở card học phí trang chi tiết và trong modal xem nhanh.
 */
export function CourseFactList({
  course,
  className = "",
}: {
  course: Course;
  className?: string;
}) {
  return (
    <ul className={`space-y-3 ${className}`}>
      {course.facts.map((fact) => {
        const Icon = factIcons[fact.label];
        return (
          <li
            key={fact.label}
            className="flex gap-3 text-[15px] leading-snug text-fg"
          >
            <Icon className="shrink-0 text-primary" size={19} />
            <p className="min-w-0">
              <span className="text-fg-subtle">{fact.label}: </span>
              {fact.value}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
