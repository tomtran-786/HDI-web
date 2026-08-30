/**
 * Dạng chuẩn của một địa chỉ email trong toàn bộ mã nguồn này.
 *
 * Ở một file riêng, không phụ thuộc gì, vì cả trình duyệt lẫn server đều cần
 * nó: `components/cart-modal.tsx` phải chuẩn hóa email thành viên đúng CÙNG một
 * cách với `lib/group-members.ts`, nếu không thì số người client đếm được sẽ
 * lệch với số người server phân giải ra — và cái lệch đó hiện ra thành một con
 * số tiền sai trên nút "Thanh toán".
 *
 * Không đặt trong lib/auth-input.ts dù đó là nơi nó ra đời: file kia dựng schema
 * zod ở phạm vi module, nên import nó vào một client component sẽ kéo cả zod và
 * toàn bộ quy tắc mật khẩu vào bundle của trình duyệt.
 */
export const normalizeEmail = (value: string) => value.trim().toLowerCase();
