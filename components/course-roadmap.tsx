import Link from "next/link";
import type { Course } from "@/content/course";

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

export function CourseRoadmap({ course }: { course: Course }) {
  return (
    <div className="space-y-7">
      {course.phases.map((phase, i) => {
        const byModule = course.curriculum === "modules";
        const offset = phaseOffset(course.phases, i);
        return (
          <div key={phase.name}>
            <h3 className="text-lg font-bold text-fg">
              {phaseKind(course)} {i + 1}: {phase.name}
            </h3>
            <ol className="mt-3 rounded-card border border-line bg-card px-5 sm:px-6">
              {phase.sessions.map((session, j) => {
                const number = byModule ? `${i + 1}.${j + 1}` : offset + j + 1;
                return (
                  <li
                    key={typeof session === "string" ? session : session.text}
                    className="flex gap-3.5 border-b border-line py-4 last:border-0"
                  >
                    <span
                      className={`mt-0.5 inline-flex h-6 shrink-0 items-center justify-center rounded-full bg-tint text-[11px] font-bold tabular-nums text-primary ${
                        byModule ? "px-2" : "w-6"
                      }`}
                    >
                      {number}
                    </span>
                    <span className="text-[15px] leading-relaxed text-fg">
                      {!byModule && (
                        <span className="font-semibold">Buổi {number}: </span>
                      )}
                      {typeof session === "string" ? (
                        session
                      ) : (
                        <Link
                          href={session.href}
                          className="font-semibold text-primary underline underline-offset-4"
                        >
                          {session.text}
                        </Link>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </div>
  );
}
