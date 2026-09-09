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
          priority
          sizes="100vw"
          className="object-cover object-[center_30%] opacity-40 dark:opacity-[0.65]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/70 via-bg/30 to-bg dark:from-bg/85 dark:via-bg/25 dark:to-bg/95" />
      </div>

      <div className="shell relative py-14 sm:py-16 lg:py-20">{children}</div>
    </section>
  );
}
