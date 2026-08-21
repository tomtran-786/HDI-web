import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { registerAccount } from "./actions";
import { Section, SectionHeading } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Tạo tài khoản — HDI Research Center",
  robots: { index: false, follow: false },
};

const inputClass =
  "mt-1.5 w-full rounded-card border border-line bg-bg px-4 py-3 text-sm text-fg outline-none transition focus:border-primary";

export default async function RegisterPage({
  searchParams,
}: PageProps<"/dang-ky-tai-khoan">) {
  const { error, sent } = await searchParams;
  if ((await auth())?.user) redirect("/tai-khoan");

  return (
    <Section soft>
      <div className="mx-auto max-w-md">
        <SectionHeading
          align="center"
          eyebrow="Khu vực học viên"
          title="Tạo tài khoản"
          subtitle="Đăng ký bằng email hoặc tiếp tục bằng Google ở trang đăng nhập."
        />
        <div className="rounded-card border border-line bg-card p-6 sm:p-8">
          {sent && (
            <p className="mb-5 rounded-card border border-line bg-bg-soft px-4 py-3 text-sm text-fg-muted">
              Nếu email có thể đăng ký, HDI đã gửi hướng dẫn xác thực. Hãy kiểm tra cả mục Spam.
            </p>
          )}
          {error && (
            <p className="mb-5 rounded-card border border-line bg-bg-soft px-4 py-3 text-sm text-fg-muted">
              Vui lòng kiểm tra họ tên, email và mật khẩu. Mật khẩu cần ít nhất 12 ký tự và tối đa 72 byte.
            </p>
          )}

          <form action={registerAccount} className="space-y-4">
            <label className="block text-sm font-semibold">
              Họ và tên
              <input className={inputClass} name="name" autoComplete="name" required minLength={2} maxLength={100} />
            </label>
            <label className="block text-sm font-semibold">
              Email
              <input className={inputClass} name="email" type="email" autoComplete="email" required />
            </label>
            <label className="block text-sm font-semibold">
              Mật khẩu
              <input className={inputClass} name="password" type="password" autoComplete="new-password" required minLength={12} />
            </label>
            <label className="block text-sm font-semibold">
              Nhập lại mật khẩu
              <input className={inputClass} name="confirmPassword" type="password" autoComplete="new-password" required minLength={12} />
            </label>
            <button className="w-full rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep" type="submit">
              Tạo tài khoản
            </button>
          </form>

          <p className="mt-5 text-xs leading-relaxed text-fg-subtle">
            Record được cấp qua Google Drive. Email đăng ký cần thuộc một tài khoản Google; địa chỉ không phải Gmail vẫn dùng được nếu đã liên kết với Google.
          </p>
          <p className="mt-5 text-center text-sm text-fg-muted">
            Đã có tài khoản? <Link className="font-bold text-primary" href="/dang-nhap">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </Section>
  );
}

