/**
 * Hình dạng hợp lệ của một đánh giá — phần thuần túy, không chạm database.
 *
 * Tách khỏi lib/reviews.ts vì form đánh giá là client component: import
 * lib/reviews.ts vào đó sẽ kéo cả Prisma vào bundle của trình duyệt. Cùng lý do
 * và cùng cách đặt tên với lib/action-input.ts và lib/auth-input.ts.
 */

export const RATING_MIN = 1;
export const RATING_MAX = 5;
export const COMMENT_MAX = 1000;

/** Năm mức sao, dùng cho cả form nhập lẫn vòng lặp hiển thị. */
export const RATING_VALUES = [1, 2, 3, 4, 5] as const;

/**
 * `rating` hợp lệ: số nguyên trong miền.
 *
 * Kiểm ở đây KHÔNG thừa dù migration đã có CHECK: một action ghi số 7 sẽ khiến
 * Postgres ném lỗi ra giữa mặt học viên, còn hàm này biến nó thành một câu
 * tiếng Việt. Hai lớp phục vụ hai người khác nhau.
 */
export function isValidRating(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= RATING_MIN &&
    value <= RATING_MAX
  );
}

/**
 * Cắt bình luận về đúng hình dạng được lưu: bỏ khoảng trắng thừa, rỗng thì trả
 * `null` chứ không phải chuỗi rỗng. Một bình luận rỗng và một đánh giá chỉ có
 * sao là cùng một thứ, và hai cách biểu diễn cho cùng một thứ luôn trôi khỏi
 * nhau — chỗ này đọc là `comment && (...)`, chỗ kia quên mất chuỗi rỗng.
 */
export function normalizeComment(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, COMMENT_MAX);
  return trimmed.length > 0 ? trimmed : null;
}
