import type { CourseSlug } from "./course";

/**
 * Số marketing do HDI tự đặt, KHÔNG phải số enrollment thật. Sửa các giá trị
 * ngay tại đây rồi deploy khi cần cập nhật nội dung quảng cáo.
 *
 * `Record` đầy đủ chứ không phải `Partial`: mọi khóa đều phải có con số để badge
 * xuất hiện trên tất cả các thẻ và trang khóa học. Thêm slug mới vào
 * `COURSE_SLUGS` mà quên điền ở đây thì TypeScript hỏng build, thay vì thẻ khóa
 * im lặng không có badge.
 */
export const enrolledCount: Record<CourseSlug, number> = {
  "nckh-ung-dung-ai-xuat-ban-quoc-te": 312,
  "training-tieu-luan-nckh-kltn": 1428,
  "nckh-chuyen-sau-spss": 690,
  "spss-smartpls-ai": 428,
  "kinh-te-luong-stata-ai": 374,
  "viet-bai-tap-chi": 517,
  "viet-bao-cao-khoa-hoc": 386,
  "ung-dung-chatgpt-nckh": 245,
};

export const enrolledLabel = "học viên đã đăng ký";
