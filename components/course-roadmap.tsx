import Link from "next/link";
import type { Course } from "@/content/course";
import { IconChevronDown } from "./ui/icons";

/** Running index of the first session in each phase, so numbering stays 1…n. */
function phaseOffset(phases: Course["phases"], index: number) {
  return phases
    .slice(0, index)
    .reduce((total, phase) => total + phase.sessions.length, 0);
}

/** A module is a teaching unit; session-based courses group classes by phase. */
function phaseKind(course: Course) {
  return course.curriculum === "modules" ? "Module" : "Giai đoạn";
}

/** "10 chủ đề" cho một module; "Buổi 3–5" cho một giai đoạn gồm nhiều buổi. */
function phaseMeta(course: Course, index: number) {
  const count = course.phases[index].sessions.length;
  if (course.curriculum === "modules") return `${count} chủ đề`;
  const first = phaseOffset(course.phases, index) + 1;
  return count === 1 ? `Buổi ${first}` : `Buổi ${first}–${first + count - 1}`;
}

/**
 * Mỗi giai đoạn/module là một thẻ gập được, module đầu mở sẵn — cách
 * theanalystacademy.com trình bày "Your Course Outline". Khóa sáu module mười
 * chủ đề mà bày hết ra thì lộ trình dài gấp mấy lần phần còn lại của trang.
 *
 * `<details>` chứ không phải accordion bằng state: nội dung đóng vẫn nằm trong
 * HTML (công cụ tìm kiếm và Ctrl+F đều thấy), và không cần JavaScript để mở.
 */
export function CourseRoadmap({ course }: { course: Course }) {
  return (
    <div className="space-y-4">
      {course.phases.map((phase, i) => {
        const byModule = course.curriculum === "modules";
        const offset = phaseOffset(course.phases, i);
        return (
          <details
            key={phase.name}
            open={i === 0}
            className="group rounded-card border border-line bg-card transition-colors open:border-primary/40"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5 [&::-webkit-details-marker]:hidden">
              <div className="min-w-0">
                <h3 className="text-base font-bold leading-snug text-primary sm:text-lg">
                  {phaseKind(course)} {i + 1}: {phase.name}
                </h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-fg-subtle">
                  {phaseMeta(course, i)}
                </p>
              </div>
              <span
                aria-hidden
                className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-fg-muted transition group-open:rotate-180 group-open:border-primary group-open:text-primary"
              >
                <IconChevronDown size={16} />
              </span>
            </summary>
            <ol className="border-t border-line px-5 sm:px-6">
              {phase.sessions.map((session, j) => {
                const number = byModule ? `${i + 1}.${j + 1}` : offset + j + 1;
                return (
                  <li
                    key={typeof session === "string" ? session : session.text}
                    className="flex gap-3.5 border-b border-line py-3.5 last:border-0"
                  >
                    <span
                      className={`mt-0.5 inline-flex h-6 shrink-0 items-center justify-center rounded-full bg-tint text-[11px] font-bold tabular-nums text-primary ${
                        byModule ? "px-2" : "w-6"
                      }`}
                    >
                      {number}
                    </span>
                    <div className="text-[15px] leading-relaxed text-fg">
                      {!byModule && (
                        <span className="font-semibold">Buổi {number}: </span>
                      )}
                      {typeof session === "string" ? (
                        session
                      ) : session.href ? (
                        <Link
                          href={session.href}
                          className="font-semibold text-primary underline underline-offset-4"
                        >
                          {session.text}
                        </Link>
                      ) : (
                        <span className={session.points ? "font-semibold" : ""}>
                          {session.text}
                        </span>
                      )}
                      {typeof session !== "string" && session.points && (
                        <ul className="mt-2 space-y-1.5">
                          {session.points.map((point) => (
                            <li
                              key={point}
                              className="flex gap-2.5 text-[14px] leading-relaxed text-fg-muted"
                            >
                              <span
                                aria-hidden
                                className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-fg-subtle"
                              />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
            {phase.summary && (
              <p className="border-t border-line px-5 py-3.5 text-[15px] font-semibold leading-relaxed text-success sm:px-6">
                {phase.summary}
              </p>
            )}
          </details>
        );
      })}
    </div>
  );
}
