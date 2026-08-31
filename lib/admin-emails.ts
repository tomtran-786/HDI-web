/**
 * Danh sách quản trị viên, đọc mỗi lần gọi.
 *
 * Một file riêng chứ không nằm trong lib/auth.ts, dù đó là nơi `isAdminEmail`
 * sống. Bên gọi thứ hai là webhook PayOS, và lib/auth.ts kéo theo cả next-auth,
 * Prisma adapter, provider Google và bcrypt — toàn bộ thứ đó không có việc gì ở
 * một endpoint máy-gọi-máy không có phiên đăng nhập nào, ngoài việc làm chậm
 * đúng con đường mà tiền đi qua.
 *
 * Đọc lại `process.env` mỗi lần gọi thay vì cache ở tầng module: một hằng số
 * đọc lúc nạp module sẽ giữ mãi giá trị của lần nạp đầu tiên trên lambda, kể cả
 * sau khi biến môi trường được đổi và deploy lại.
 */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
