import { courses, type Course, type CourseSlug } from "@/content/course";
import { formatDate, startOfDayVN } from "./format";

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

/** Một mục trong dải lịch khai giảng ở trang chủ. */
export type OpeningAnnouncement = {
  slug: CourseSlug;
  title: string;
  /** ISO `YYYY-MM-DD` — đi thẳng vào `dateTime` của <time>. */
  startDate: string;
  /** `22/09/2026`, giờ Việt Nam — bản in ra cho người đọc. */
  dateLabel: string;
};

/**
 * Các khóa ĐANG BÁN mà đã chốt ngày khai giảng, sắp ngày gần nhất trước.
 *
 * Nhận thẳng danh sách khóa mà `OpenCourses` vừa lọc, KHÔNG tự đọc dữ liệu và
 * cũng không tra `availability` lần nữa: dải chạy và mục "Khóa học đang nhận học
 * viên" phải chung đúng một cái cổng, nếu không sẽ có ngày dải quảng cáo một
 * khóa mà bên dưới không có thẻ nào.
 *
 * Ngày hỏng — chuỗi sai dạng, hoặc một ngày không tồn tại như "2026-02-31" —
 * bị BỎ chứ không in bừa, vì `startOfDayVN` trả `null` cho những chuỗi đó.
 */
export function openingAnnouncements(open: Course[]): OpeningAnnouncement[] {
  return open
    .flatMap((course) => {
      if (!course.opening) return [];
      const at = startOfDayVN(course.opening.startDate);
      if (!at) return [];
      return [
        {
          slug: course.slug,
          title: course.title,
          startDate: course.opening.startDate,
          dateLabel: formatDate(at),
        },
      ];
    })
    // ISO `YYYY-MM-DD` sắp theo chuỗi là sắp đúng theo thời gian.
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}
