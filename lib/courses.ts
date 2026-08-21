import { courses, type Course, type CourseSlug } from "@/content/course";

/** Bridge a persisted Course slug to its authored marketing content. */
export function findCourse(slug: string): Course | undefined {
  return courses.find((course) => course.slug === slug);
}

export function isCourseSlug(slug: string): slug is CourseSlug {
  return courses.some((course) => course.slug === slug);
}
