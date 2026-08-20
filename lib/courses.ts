import { courses, type Course, type CourseSlug } from "@/content/course";

/**
 * The bridge between the database and content/course.ts.
 *
 * A cohort row names its course by slug, but the database cannot enforce that
 * the slug still exists — a course renamed in content/ leaves orphan rows
 * behind. Everything that turns a cohort into something a student sees goes
 * through here, so an orphan degrades into "skipped and logged" rather than a
 * crashed dashboard.
 */
export function findCourse(slug: string): Course | undefined {
  return courses.find((course) => course.slug === slug);
}

export function isCourseSlug(slug: string): slug is CourseSlug {
  return courses.some((course) => course.slug === slug);
}

/**
 * Attach the marketing course to each row, dropping rows whose slug no longer
 * matches anything. The warning is deliberately loud: a silently missing course
 * looks identical to "no cohorts scheduled yet".
 */
export function withCourse<T extends { courseSlug: string }>(
  rows: T[],
): (T & { course: Course })[] {
  const out: (T & { course: Course })[] = [];
  for (const row of rows) {
    const course = findCourse(row.courseSlug);
    if (!course) {
      console.warn(
        `[courses] Bỏ qua kỳ học trỏ tới khóa không tồn tại: "${row.courseSlug}". ` +
          `Slug phải khớp một khóa trong content/course.ts.`,
      );
      continue;
    }
    out.push({ ...row, course });
  }
  return out;
}
