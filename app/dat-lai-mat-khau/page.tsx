import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionHeading } from "@/components/ui/section";
import { resetPassword } from "./actions";

export const metadata: Metadata = {
  title: "Đặt lại mật khẩu — HDI Research Center",
  robots: { index: false, follow: false },
};

const inputClass = "mt-1.5 w-full rounded-card border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-primary";

export default async function ResetPasswordPage({ searchParams }: PageProps<"/dat-lai-mat-khau">) {
  const { token, error } = await searchParams;
  const safeToken = typeof token === "string" ? token : "";
  return (
    <Section soft>
      <div className="mx-auto max-w-md">
        <SectionHeading align="center" eyebrow="Bảo mật tài khoản" title="Đặt lại mật khẩu" subtitle="Mật khẩu mới sẽ đăng xuất các phiên cũ." />
        <div className="rounded-card border border-line bg-card p-6 sm:p-8">
          {(error || !safeToken) && <p className="mb-5 text-sm text-fg-muted">Liên kết không hợp lệ, đã hết hạn hoặc mật khẩu chưa đáp ứng yêu cầu.</p>}
          {safeToken && (
            <form action={resetPassword} className="space-y-4">
              <input type="hidden" name="token" value={safeToken} />
              <label className="block text-sm font-semibold">Mật khẩu mới<input className={inputClass} name="password" type="password" autoComplete="new-password" minLength={12} required /></label>
              <label className="block text-sm font-semibold">Nhập lại mật khẩu<input className={inputClass} name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required /></label>
              <button type="submit" className="w-full rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg">Đổi mật khẩu</button>
            </form>
          )}
          <p className="mt-5 text-center text-sm"><Link className="font-bold text-primary" href="/dang-nhap">Quay lại đăng nhập</Link></p>
        </div>
      </div>
    </Section>
  );
}

