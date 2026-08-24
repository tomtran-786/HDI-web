import { avatarInitials, safeAvatarUrl } from "@/lib/avatar";

const SIZES = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-14 w-14 text-lg",
} as const;

/**
 * Ảnh đại diện của người đang đăng nhập, kèm phương án dự phòng bằng chữ cái.
 *
 * Dùng thẻ <img> thường chứ không phải next/image, và đó là chủ ý: URL avatar
 * của Google là ảnh nhỏ, mỗi người một cái, đổi khi người dùng đổi ảnh. Cho
 * chúng đi qua bộ tối ưu ảnh của Vercel chỉ tiêu hạn mức biến đổi ảnh của gói
 * Hobby mà không nhỏ đi được bao nhiêu. CSP đã mở sẵn `img-src` cho host này —
 * xem lib/security-headers.ts — và lib/auth-avatar.ts đảm bảo `src` chỉ có thể
 * là host đó.
 */
export function Avatar({
  src,
  name,
  email,
  size = "md",
  className = "",
}: {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  // Lọc ngay tại chỗ render: một hàng cũ trong database, có từ trước bộ lọc,
  // vẫn không thể đi ra thành thẻ <img>.
  const url = safeAvatarUrl(src);
  const base = `${SIZES[size]} shrink-0 overflow-hidden rounded-full border border-line bg-tint ${className}`;

  if (url) {
    return (
      // alt="" — chỗ nào cũng có tên hoặc nhãn ngay bên cạnh, nên đọc lại tên
      // lần nữa chỉ làm trình đọc màn hình lặp.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        width={96}
        height={96}
        loading="lazy"
        decoding="async"
        // Không gửi đường dẫn trang nội bộ sang Google kèm mỗi lần tải ảnh.
        referrerPolicy="no-referrer"
        className={`${base} object-cover`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`${base} inline-flex items-center justify-center font-bold uppercase text-primary`}
    >
      {avatarInitials(name, email)}
    </span>
  );
}
