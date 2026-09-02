/**
 * Dấu "vừa được đưa sang PayOS", ở dạng cả trình duyệt lẫn server đều đọc được.
 *
 * Đây là thứ duy nhất cho HDI biết một phiên thanh toán đang treo dở. PayOS chỉ
 * gọi về `cancelUrl` khi học viên bấm đúng nút "Hủy"; đóng tab, bấm Back, hay
 * để app ngân hàng nuốt mất deep link đều không sinh ra tín hiệu nào. Cookie này
 * là tín hiệu đó, và nó đi cùng trình duyệt chứ không cùng đơn.
 *
 * KHÔNG `httpOnly`, cùng lý do với cookie giỏ hàng: `<CheckoutReclaim />` phải
 * đọc được nó để biết có đáng gọi một request nào không. Không có gì bí mật ở
 * đây — giá trị chỉ là mã đơn (vốn là số tự tăng đoán được) hoặc `ref` dịch vụ
 * mà người này đã sở hữu, và endpoint thu hồi tự thu hẹp theo phiên đăng nhập
 * chứ không tin cookie.
 */

import { ORDER_TTL_HOURS, SERVICE_ORDER_TTL_HOURS } from "./order-ttl";

export const HANDOFF_COOKIE = "hdi-thanh-toan";

/**
 * Phủ trọn đơn sống lâu nhất mà cookie này có thể trỏ tới.
 *
 * Cùng một cookie mang cả hai loại — `order` sống `ORDER_TTL_HOURS` và `service`
 * sống `SERVICE_ORDER_TTL_HOURS` — nên hạn phải theo cái dài hơn. Hai chiều sai
 * KHÔNG cân nhau: một dấu sống dai hơn đơn chỉ tốn đúng một lượt POST trả về
 * `huy: false` rồi tự xóa, trong khi một dấu chết sớm là đơn treo giữ ghế cho
 * tới lượt cron 03:00 hôm sau, và trong quãng đó chính người mua bị chặn khỏi
 * khóa của mình.
 *
 * Đây từng là số cứng `2 * 60 * 60` kèm một comment nói rằng nó bằng
 * `ORDER_TTL_HOURS`. Ngày 02/09/2026 `ORDER_TTL_HOURS` được nâng 2 → 6 và con số
 * này ở lại; đơn #100035 bỏ dở lúc 15:07 mất dấu lúc 17:07 nhưng vẫn giữ ghế tới
 * 21:07. Đọc thẳng từ hằng số là cách để lần sau không lặp lại.
 */
export const HANDOFF_MAX_AGE =
  Math.max(ORDER_TTL_HOURS, SERVICE_ORDER_TTL_HOURS) * 60 * 60;

export type CheckoutHandoff =
  | { kind: "order"; key: string }
  | { kind: "service"; key: string };

/** `ref` đơn dịch vụ là 32 hex; `code` đơn khóa học là số nguyên. */
export function serializeHandoff(handoff: CheckoutHandoff) {
  return `${handoff.kind}:${handoff.key}`;
}

/**
 * Cookie do trình duyệt nắm nên mọi giá trị ở đây đều là đầu vào của kẻ tấn
 * công. Không khớp khuôn thì trả `null` chứ không chuyển tiếp xuống Prisma —
 * cùng luật với `parseCart`.
 */
export function parseHandoff(raw: string | null | undefined): CheckoutHandoff | null {
  if (!raw) return null;
  const [kind, ...rest] = raw.split(":");
  const key = rest.join(":");
  if (kind === "order" && /^\d{1,15}$/.test(key)) return { kind, key };
  if (kind === "service" && /^[0-9a-f]{32}$/.test(key)) return { kind, key };
  return null;
}
