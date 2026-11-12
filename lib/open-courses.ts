import { courses, type Course } from "@/content/course";
import { landingCourseData } from "@/lib/course-sales";

export type OpenCourse = { course: Course; remaining: number };

/**
 * Các khóa thực sự đang nhận đăng ký và còn ít nhất một chỗ — nguồn duy nhất
 * cho bảng chương trình ở hero trang chủ.
 *
 * Không dựng số ghế giả khi Supabase tạm thời không đọc được: trả về mảng
 * rỗng và bảng tự ẩn. Trang khóa học và checkout vẫn có cơ chế fail-open /
 * kiểm tra trực tiếp riêng của chúng.
 */
export async function readOpenCourses(): Promise<OpenCourse[]> {
  try {
    const { availability, seatsLeft } = await landingCourseData();
    return courses.flatMap((course) => {
      const remaining = seatsLeft[course.slug];
      return availability[course.slug] === "buyable" && remaining > 0
        ? [{ course, remaining }]
        : [];
    });
  } catch (error) {
    console.error("[home-open-courses] Không đọc được số chỗ:", error);
    return [];
  }
}

const WEEKDAYS = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

/** "2026-12-01" → { day: "01/12", weekday: "Thứ Ba", month: 12, year: 2026 }. */
export function openingParts(startDate: string) {
  const [year, month, day] = startDate.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return {
    day: `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`,
    weekday,
    month,
    year,
  };
}

/** Giờ học lấy từ ô "Lịch học" ("… · 19:00 – 21:00" → "19:00–21:00"). */
export function sessionTime(course: Course) {
  const schedule = course.facts.find((fact) => fact.label === "Lịch học")?.value ?? "";
  const match = schedule.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
  return match ? `${match[1]}–${match[2]}` : null;
}

/**
 * Thứ tự trong bảng: khóa sắp khai giảng trước (ngày gần nhất lên đầu), rồi
 * khóa đã khai giảng nhưng vẫn nhận người, cuối cùng là khóa chưa chốt ngày.
 * `today` là ngày theo giờ Việt Nam dạng "YYYY-MM-DD".
 */
export function programmeOrder(open: OpenCourse[], today: string) {
  const rank = ({ course }: OpenCourse) => {
    const start = course.opening?.startDate;
    if (!start) return [2, ""] as const;
    return start >= today ? ([0, start] as const) : ([1, start] as const);
  };
  return [...open].sort((a, b) => {
    const [ra, sa] = rank(a);
    const [rb, sb] = rank(b);
    return ra - rb || sa.localeCompare(sb);
  });
}

/** Ngày hôm nay theo giờ Việt Nam, dạng "YYYY-MM-DD". */
export function todayInVietnam(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(now);
}

/** "tháng 11 – 12/2026" từ các ngày khai giảng đã biết; null khi chưa có ngày nào. */
export function programmeSpan(open: OpenCourse[]) {
  const dates = open
    .map(({ course }) => course.opening?.startDate)
    .filter((date): date is string => Boolean(date))
    .sort();
  if (dates.length === 0) return null;
  const first = openingParts(dates[0]);
  const last = openingParts(dates[dates.length - 1]);
  if (first.year !== last.year) return `tháng ${first.month}/${first.year} – ${last.month}/${last.year}`;
  if (first.month === last.month) return `tháng ${first.month}/${first.year}`;
  return `tháng ${first.month} – ${last.month}/${last.year}`;
}
