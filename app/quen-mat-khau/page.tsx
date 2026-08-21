import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionHeading } from "@/components/ui/section";
import { requestPasswordReset } from "./actions";

export const metadata: Metadata = {
  title: "Quên mật khẩu — HDI Research Center",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage({ searchParams }: PageProps<"/quen-mat-khau">) {
  const { sent } = await searchParams;
  return (
    <Section soft>
      <div className="mx-auto max-w-md">
        <SectionHeading align="center" eyebrow="Bảo mật tài khoản" title="Quên mật khẩu" subtitle="Nhận liên kết đặt lại mật khẩu qua email." />
        <div className="rounded-card border border-line bg-card p-6 sm:p-8">
          {sent && <p className="mb-5 rounded-card border border-line bg-bg-soft px-4 py-3 text-sm text-fg-muted">Nếu email đã đăng ký, HDI đã gửi hướng dẫn. Hãy kiểm tra cả mục Spam.</p>}
          <form action={requestPasswordReset} className="space-y-4">
            <label className="block text-sm font-semibold">
              Email
              <input className="mt-1.5 w-full rounded-card border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-primary" name="email" type="email" autoComplete="email" required />
            </label>
            <button type="submit" className="w-full rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg">Gửi liên kết</button>
          </form>
          <p className="mt-5 text-center text-sm"><Link className="font-bold text-primary" href="/dang-nhap">Quay lại đăng nhập</Link></p>
        </div>
      </div>
    </Section>
  );
}

