import { z } from "zod";
import { ID_RE } from "./cart-cookie";

/**
 * Kiểm tra hình dạng của một id đi vào Server Action.
 *
 * Không phải chuyện thừa, dù TypeScript đã ghi kiểu `string`. Một Server Action
 * là một endpoint POST riêng: Next deserialize payload từ trình duyệt rồi gọi
 * hàm, và kiểu chỉ tồn tại lúc biên dịch. Nếu client gửi `{ not: "" }` thay vì
 * một chuỗi, Prisma nhận nó như MỘT BỘ LỌC chứ không phải một giá trị — và
 * `where: { id: { not: "" } }` khớp với hàng đầu tiên bất kỳ thay vì không khớp
 * gì cả.
 *
 * Dùng chung ID_RE với cookie giỏ hàng để không bao giờ có hai định nghĩa
 * "id hợp lệ" lệch nhau.
 */
export const idSchema = z.string().regex(ID_RE);

/** `null` khi đầu vào không phải một id — để caller trả lỗi thay vì throw. */
export function parseId(value: unknown): string | null {
  const parsed = idSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
