import type { CSSProperties } from "react";
import { IconCheck } from "./icons";

/** Dấu tích trong vòng tròn, dùng cho danh sách kết quả và hồ sơ giảng viên. */
export function CheckDot({
  className = "",
  style,
}: {
  /** Thêm class cho chuyển động (vd. `cert-tick` ở khối chứng nhận). */
  className?: string;
  style?: CSSProperties;
} = {}) {
  return (
    <span
      aria-hidden
      style={style}
      className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-tint text-success ${className}`}
    >
      <IconCheck size={14} />
    </span>
  );
}
