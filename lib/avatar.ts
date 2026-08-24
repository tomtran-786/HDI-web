/**
 * Phần thuần của ảnh đại diện: không chạm vào database, không chạm vào request.
 *
 * Tách khỏi lib/auth-avatar.ts là có lý do cụ thể: components/ui/avatar.tsx
 * được render bên trong site-header.tsx, một client component. Import một
 * module có `prisma` vào đó là kéo cả Prisma Client vào bundle của trình duyệt.
 */
/**
 * Ảnh đại diện chỉ được nhận từ host mà Google phục vụ avatar.
 *
 * Hai lý do, cả hai đều cần:
 *  - CSP trong lib/security-headers.ts chỉ mở `img-src` cho đúng host này. Một
 *    URL ở host khác sẽ bị trình duyệt chặn và hiện thành ô ảnh vỡ.
 *  - Giá trị đi thẳng từ nhà cung cấp vào cột `image` rồi ra thẻ <img>. Lọc ở
 *    một chỗ duy nhất là cách giữ cho không có URL lạ nào — kể cả `javascript:`
 *    hay một tracker — được render dưới danh nghĩa ảnh đại diện.
 *
 * Thêm host mới ở đây thì phải thêm cả vào `img-src` của CSP, nếu không ảnh sẽ
 * qua được hàm này rồi chết ở trình duyệt.
 */
const AVATAR_HOSTS = new Set(["lh3.googleusercontent.com"]);

/** URL avatar đã lọc, hoặc null nếu không dùng được. */
export function safeAvatarUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (!AVATAR_HOSTS.has(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** `picture` trong profile OpenID của Google, sau khi lọc. */
export function googleProfilePicture(profile: unknown): string | null {
  return safeAvatarUrl((profile as { picture?: unknown } | null)?.picture);
}

/**
 * Chữ cái thay cho ảnh khi không có avatar: tối đa hai chữ đầu của tên, lùi về
 * ký tự đầu của email khi tên trống — mọi tài khoản đều có email.
 */
export function avatarInitials(
  name?: string | null,
  email?: string | null,
): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length > 0) {
    const first = words[0][0];
    const last = words.length > 1 ? words[words.length - 1][0] : "";
    return (first + last).toUpperCase();
  }
  const local = (email ?? "").trim();
  return local ? local[0].toUpperCase() : "?";
}
