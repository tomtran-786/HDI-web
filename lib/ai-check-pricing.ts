import {
  aiCheckKinds,
  aiCheckTiers,
  WORD_LIMIT,
  type AiCheckKind,
  type AiCheckTierId,
} from "@/content/ai-check";

/**
 * Một hàm thuần, dùng chung cho trình duyệt và server action.
 *
 * Con số học viên nhìn thấy trước khi bấm và con số gửi sang PayOS phải do
 * CÙNG một hàm sinh ra. Nếu client tự tính để hiển thị còn server tự tính lại
 * theo cách khác, hai bên sẽ lệch nhau đúng vào lúc bảng giá đổi — và cái lệch
 * đó là một hóa đơn sai, không phải một lỗi hiển thị.
 *
 * Không nhận số tiền từ đầu vào ở bất kỳ dạng nào: `quote()` chỉ nhận số từ và
 * loại dịch vụ, giá luôn được tra từ bảng.
 */

export type Quote =
  | { ok: true; tier: AiCheckTierId; amountVnd: number }
  | { ok: false; reason: "invalid_words" | "invalid_kind" | "too_long" };

const kindIds = new Set<string>(aiCheckKinds.map((kind) => kind.id));

export function isAiCheckKind(value: unknown): value is AiCheckKind {
  return typeof value === "string" && kindIds.has(value);
}

/**
 * Số từ hợp lệ: số nguyên dương.
 *
 * `Number.isInteger` đã loại cả `NaN`, `Infinity` và số thập phân trong một
 * phép kiểm — quan trọng vì đầu vào đến từ payload của Server Action, nơi kiểu
 * TypeScript chỉ tồn tại lúc biên dịch và một chuỗi "10000" hay `{}` đều có thể
 * lọt tới đây.
 */
export function isValidWordCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function quote(words: unknown, kind: unknown): Quote {
  if (!isValidWordCount(words)) return { ok: false, reason: "invalid_words" };
  if (!isAiCheckKind(kind)) return { ok: false, reason: "invalid_kind" };
  if (words > WORD_LIMIT) return { ok: false, reason: "too_long" };

  // Bậc đầu tiên còn chứa được số từ này. Các bậc trong content/ai-check.ts
  // xếp tăng dần theo `maxWords`, nên "bậc đầu tiên khớp" cũng là bậc rẻ nhất
  // khớp — đúng cách đọc dấu "≤" ở mỗi ranh giới bậc.
  const tier = aiCheckTiers.find((candidate) => words <= candidate.maxWords);
  // Không xảy ra được: WORD_LIMIT chính là `maxWords` của bậc cuối, nên mọi số
  // đi qua được kiểm tra trên đều tìm thấy bậc. Vẫn xử lý để một bảng giá sửa
  // sai trong tương lai báo lỗi thay vì báo giá bằng `undefined`.
  if (!tier) return { ok: false, reason: "too_long" };

  return { ok: true, tier: tier.id, amountVnd: tier.prices[kind] };
}
