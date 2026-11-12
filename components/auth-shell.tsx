import type { ReactNode } from "react";

/**
 * Khung dùng chung cho các màn thuộc "khu vực học viên" — luồng xác thực (đăng
 * nhập, đăng ký, quên/đặt lại mật khẩu, xác thực email, hoàn tất hồ sơ) và khu
 * vực tài khoản đã đăng nhập (/tai-khoan, /tai-khoan/don-hang[/…],
 * /tai-khoan/gioi-thieu), cùng các loading.tsx của chúng.
 *
 * Mặt giấy phẳng như mọi trang khác của redesign: không còn ảnh nền và lớp
 * gradient phía sau form. Ở các màn có tiền và mật khẩu, sự rõ ràng quan trọng
 * hơn không khí; chữ tiêu đề nằm thẳng trên nền nên tương phản luôn đủ. Mỗi
 * trang tự giữ `<div className="mx-auto max-w-md">` của nó.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <section
      data-auth-shell
      className="scroll-mt-24 border-t border-line bg-bg-soft text-fg"
    >
      <div className="shell py-14 sm:py-16 lg:py-20">{children}</div>
    </section>
  );
}
