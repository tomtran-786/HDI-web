import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionHeading } from "@/components/ui/section";
import { resendVerification, verifyEmail } from "./actions";

export const metadata: Metadata = {
  title: "Xác thực email — HDI Research Center",
  robots: { index: false, follow: false },
};

const inputClass =
  "mt-1.5 w-full rounded-card border border-line bg-bg px-4 py-3 text-sm text-fg outline-none transition focus:border-primary";

export default async function VerifyEmailPage({
  searchParams,
}: PageProps<"/xac-thuc-email">) {
  const { token, error, sent } = await searchParams;
  const safeToken = typeof token === "string" ? token : "";

  return (
    <Section soft>
      <div className="mx-auto max-w-md">
        <SectionHeading align="center" eyebrow="Bảo mật tài khoản" title="Xác thực email" subtitle="Xác nhận trước khi đăng nhập bằng mật khẩu." />
        <div className="rounded-card border border-line bg-card p-6 sm:p-8">
          {error && <p className="mb-5 text-sm text-fg-muted">Liên kết không hợp lệ, đã hết hạn hoặc đã được sử dụng.</p>}
          {sent && <p className="mb-5 text-sm text-fg-muted">Nếu tài khoản đang chờ xác thực, HDI đã gửi một liên kết mới.</p>}
          {safeToken ? (
            <form action={verifyEmail}>
              <input type="hidden" name="token" value={safeToken} />
              <button type="submit" className="w-full rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep">
                Xác thực email này
              </button>
            </form>
          ) : (
            <form action={resendVerification} className="space-y-4">
              <label className="block text-sm font-semibold">
                Email cần gửi lại
                <input className={inputClass} name="email" type="email" autoComplete="email" required />
              </label>
              <button type="submit" className="w-full rounded-full border border-primary px-6 py-3 text-sm font-bold text-primary">
                Gửi lại email xác thực
              </button>
            </form>
          )}
          <p className="mt-5 text-center text-sm"><Link className="font-bold text-primary" href="/dang-nhap">Quay lại đăng nhập</Link></p>
        </div>
      </div>
    </Section>
  );
}

