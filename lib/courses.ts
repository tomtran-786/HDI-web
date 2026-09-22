import { courses, type Course, type CourseSlug } from "@/content/course";

/** Bridge a persisted Course slug to its authored marketing content. */
export function findCourse(slug: string): Course | undefined {
  return courses.find((course) => course.slug === slug);
}

export function isCourseSlug(slug: string): slug is CourseSlug {
  return courses.some((course) => course.slug === slug);
}

/**
 * Dòng tóm tắt "khóa nào có trong đơn này", gộp theo khóa.
 *
 * Một đơn nhóm giữ MỘT ghế cho mỗi người, nên ba người mua cùng một khóa là ba
 * `order_items` — nối thẳng danh sách item lại sẽ in cùng một tên khóa ba lần.
 * Số người đã có badge riêng nói rồi; dòng này trả lời câu hỏi khác, là "đơn
 * này gồm những khóa gì".
 *
 * Giữ nguyên thứ tự xuất hiện, và dùng `code` chứ không dùng `slug` làm khóa
 * gộp vì `code` mới là thứ được in ra.
 */
export function courseSummaryLine(
  items: { course: { code: string; slug: string } }[],
) {
  const seen = new Map<string, string>();
  for (const item of items) {
    if (seen.has(item.course.code)) continue;
    const title = findCourse(item.course.slug)?.title ?? item.course.slug;
    seen.set(item.course.code, `${item.course.code} · ${title}`);
  }
  return [...seen.values()].join(" — ");
}
