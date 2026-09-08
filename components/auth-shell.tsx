import type { ReactNode } from "react";
import Image from "next/image";

/**
 * Khung dùng chung cho toàn bộ luồng xác thực — sáu trang page.tsx (đăng nhập,
 * đăng ký, quên/đặt lại mật khẩu, xác thực email, hoàn tất hồ sơ) và sáu
 * loading.tsx của chúng.
 *
 * Nó sao lại đúng lớp nền của `<Section soft>` (components/ui/section.tsx) —
 * `border-t border-line bg-bg-soft` + `shell py-16 sm:py-20 lg:py-24` — rồi đặt
 * thêm một lớp ảnh nền tĩnh phía sau. Mỗi trang tự giữ `<div className="mx-auto
 * max-w-md">` của nó, nên phép thay chỉ là đổi thẻ bọc ngoài cùng.
 *
 * Cơ chế xếp lớp mượn từ hero (components/sections/hero.tsx): lớp trang trí là
 * anh em `absolute inset-0` đứng trước trong DOM, khối nội dung theo sau và mang
 * `relative` nên vẽ đè lên — không cần z-index âm.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <section className="relative overflow-hidden scroll-mt-24 border-t border-line bg-bg-soft text-fg">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Image
          src="/images/auth-bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-40 dark:opacity-[0.15]"
        />
        {/* Xô nền: giữ chữ tiêu đề luôn đọc rõ và cho mép dưới hoà vào bg-bg-soft. */}
        <div className="absolute inset-0 bg-gradient-to-b from-bg-soft/60 via-bg-soft/25 to-bg-soft dark:from-bg/75 dark:via-bg/85 dark:to-bg" />
      </div>

      <div className="shell relative py-16 sm:py-20 lg:py-24">{children}</div>
    </section>
  );
}
