/**
 * Một nguồn duy nhất cho hình dạng nút trên toàn site.
 *
 * Trả về chuỗi class thay vì một component, vì cùng một hình nút được gắn lên
 * `<button>`, `<Link>`, `<a>`, `CtaLink` và `SubmitButton` — mỗi thứ có prop
 * riêng, bọc lại hết thì chỉ thêm một lớp không ai cần. Vị trí (margin,
 * `w-full`, `flex-1`) vẫn do chỗ gọi thêm vào bằng `className`.
 *
 * Bo góc 10px (`rounded-button`, token `--radius-button`), theo nút của
 * theanalystacademy.com mà chủ dự án chọn làm chuẩn. Không bóng, không viên
 * thuốc. Focus dùng outline toàn cục trong globals.css.
 */

type Variant = "primary" | "secondary" | "quiet" | "onBand";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-button font-semibold whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  /** Hành động chính của khung: Đăng ký, Thanh toán. Một cái mỗi vùng. */
  primary: "bg-primary text-primary-fg hover:bg-primary-deep",
  /** Hành động phụ đặt cạnh nút chính. */
  secondary: "border border-rule bg-transparent text-fg hover:bg-fg hover:text-bg",
  /** Hành động thứ ba, gần với một liên kết. */
  quiet: "text-primary underline decoration-1 underline-offset-4 hover:decoration-2",
  /** Nút trên dải navy. */
  onBand: "bg-white text-[#0c3f7a] hover:bg-white/90",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-12 px-6 text-base",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  className = "",
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  // `quiet` là chữ có gạch chân: không có chiều cao hay padding của nút.
  const sizing = variant === "quiet" ? "text-[0.9375rem]" : sizes[size];
  return `${base} ${variants[variant]} ${sizing} ${className}`.trim();
}
