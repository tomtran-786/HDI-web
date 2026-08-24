import type { CourseSlug } from "./course";

/**
 * Số marketing do HDI tự đặt, KHÔNG phải số enrollment thật. Sửa các giá trị
 * ngay tại đây rồi deploy khi cần cập nhật nội dung quảng cáo.
 *
 * Record chứ không phải mảng: thêm slug mới vào `COURSE_SLUGS` mà quên con số ở
 * đây thì TypeScript hỏng build, thay vì thẻ khóa im lặng không có badge.
 */
export const enrolledCount: Record<CourseSlug, number> = {
  "training-tieu-luan-nckh-kltn": 1428,
  "nckh-chuyen-sau-spss": 862,
  "stata-kinh-te-luong": 634,
  "viet-bai-tap-chi": 517,
  "viet-bao-cao-khoa-hoc": 386,
  "ung-dung-chatgpt-nckh": 245,
};

export const enrolledLabel = "học viên đã đăng ký";
