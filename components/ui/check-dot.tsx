import { IconCheck } from "./icons";

/** Dấu tích trong vòng tròn, dùng cho danh sách kết quả và hồ sơ giảng viên. */
export function CheckDot() {
  return (
    <span
      aria-hidden
      className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-tint text-success"
    >
      <IconCheck size={14} />
    </span>
  );
}
