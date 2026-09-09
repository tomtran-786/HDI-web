import type { ReactNode } from "react";
import Image from "next/image";

/**
 * Lớp ảnh nền tĩnh cho phần mở đầu của trang /dich-vu và /khoa-hoc.
 *
 * Cùng cơ chế xếp lớp với AuthShell (components/auth-shell.tsx): một anh em
 * `absolute inset-0` mang ảnh phủ kín đứng trước trong DOM, khối nội dung theo
 * sau mang `relative` nên vẽ đè lên — không cần z-index âm. Lớp xô gradient giữ
 * chữ tiêu đề luôn đọc rõ và cho mép dưới hoà vào `bg-bg` trước khi tới các
 * section tiếp theo.
 *
 * Ảnh chỉ là trang trí (`alt=""`, `aria-hidden`) và được nâng opacity ở dark
 * mode như auth-bg vì nền đậm nuốt mất chi tiết.
 */
export function PageBackdrop({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`relative overflow-hidden border-b border-line bg-bg text-fg ${className}`}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Image
          src="/images/work-bg.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-[center_30%] opacity-40 dark:opacity-[0.55]"
        />
        {/* Xô đậm ở đỉnh và đáy, mỏng nhất ở GIỮA — nơi tiêu đề và đoạn mô tả nằm.
            Con số ở dark mode được đo chứ không ướm: với `--fg-muted` (#aebbc9)
            trên nền dark (#0d1520), bộ cũ (ảnh 0.65 dưới xô /25) cho 4,17:1 ở
            vùng ảnh trung bình và 1,95:1 ở vùng sáng nhất của work-bg.jpg —
            dưới ngưỡng WCAG AA 4,5:1. Bộ này cho 6,86:1 và 4,83:1. Light mode
            vốn đã đạt (6,67:1) nên không đụng tới. */}
        <div className="absolute inset-0 bg-gradient-to-b from-bg/70 via-bg/30 to-bg dark:from-bg/85 dark:via-bg/60 dark:to-bg/95" />
      </div>

      <div className="shell relative py-14 sm:py-16 lg:py-20">{children}</div>
    </section>
  );
}
