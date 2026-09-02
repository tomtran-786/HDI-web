/**
 * Hai thời hạn sống của đơn, tách riêng khỏi `lib/orders.ts` và
 * `lib/service-orders.ts` vì trình duyệt cũng cần đọc chúng.
 *
 * `lib/checkout-handoff-cookie.ts` chạy trong bundle client — nó là thứ
 * `<CheckoutReclaim />` import — nên nó không thể với tới hai file kia, vốn kéo
 * theo Prisma và PayOS. Trước khi có file này, hạn của cookie bàn giao là một số
 * cứng "2 giờ" đặt cạnh một comment nói rằng nó bằng `ORDER_TTL_HOURS`; ngày
 * 02/09/2026 `ORDER_TTL_HOURS` được nâng lên 6 và con số kia ở lại, nên một đơn
 * bỏ dở mất dấu thu hồi sau 2 giờ trong khi vẫn giữ ghế thêm 4 giờ nữa.
 */

/**
 * How long a pending order holds its seats.
 *
 * A pending enrolment occupies a place. Without a deadline an abandoned
 * checkout keeps that place forever and the course quietly looks
 * full — the failure nobody notices, because nothing errors. PayOS and the
 * local reservation share the same deadline (see `expiredAt` in
 * `lib/payment-checkout.ts`).
 *
 * Sáu giờ, không phải hai: chuyển khoản liên ngân hàng ngoài giờ hành chính có
 * thể về chậm cả tiếng, và khi tiền về sau mốc này thì webhook đẩy giao dịch vào
 * hàng đối soát thủ công thay vì cấp quyền — khách đã trả tiền mà vẫn thấy "Quá
 * hạn". `ORDER_LATE_GRACE_MINUTES` là lớp vá thứ hai cho phần vẫn lọt qua.
 */
export const ORDER_TTL_HOURS = 6;

/**
 * Đơn dịch vụ sống 24 giờ, dài hơn hẳn 6 giờ của đơn khóa học.
 *
 * Không phải sự thiếu nhất quán: 6 giờ của đơn khóa học là thời hạn GIỮ CHỖ, và
 * nó ngắn vì mỗi phút trôi qua là một chỗ ngồi bị treo khỏi tay người khác. Đơn
 * dịch vụ không giữ tài nguyên của ai; hết hạn ở đây chỉ là dọn dẹp, nên thời
 * hạn được chọn theo sự thuận tiện của học viên chứ không theo sức ép nào.
 */
export const SERVICE_ORDER_TTL_HOURS = 24;
