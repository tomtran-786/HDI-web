import type { Metadata } from "next";
import Link from "next/link";
import { resetPage } from "@/content/auth";
import { safeNext } from "@/lib/safe-path";
import { Section, SectionHeading } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { resetPassword } from "./actions";

export const metadata: Metadata = {
  title: "Đặt lại mật khẩu — HDI Research Center",
  robots: { index: false, follow: false },
};

const inputClass =
  "mt-1.5 w-full rounded-card border border-line bg-bg px-4 py-3 text-sm outline-none transition focus:border-primary";

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/dat-lai-mat-khau">) {
  const { token, error, tiep } = await searchParams;
  const safeToken = typeof token === "string" ? token : "";
  const next = safeNext(tiep);
  const nextQuery =
    next === "/tai-khoan" ? "" : `?tiep=${encodeURIComponent(next)}`;
  // No token means the link was mangled or never carried one; `error` means the
  // action refused it. Both leave nothing to submit, so both get the way out.
  const unusable = Boolean(error) || !safeToken;

  return (
    <Section soft>
      <div className="mx-auto max-w-md">
        <SectionHeading
          align="center"
          eyebrow={resetPage.eyebrow}
          title={resetPage.title}
          subtitle={resetPage.subtitle}
        />

        <Card className="p-6 sm:p-8" hover={false}>
          {unusable && (
            <div className={safeToken ? "mb-5" : undefined}>
              <p className="text-sm font-bold text-danger">
                {resetPage.invalid.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                {resetPage.invalid.body}
              </p>
              {/* Without this the holder of a dead link is stranded: the only
                  other exit is a sign-in page they still cannot get past. */}
              <Link
                href={`/quen-mat-khau${nextQuery}`}
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
              >
                {resetPage.invalid.cta}
              </Link>
            </div>
          )}

          {safeToken && (
            <form action={resetPassword} className="space-y-4">
              <input type="hidden" name="token" value={safeToken} />
              <input type="hidden" name="tiep" value={next} />
              <label className="block text-sm font-semibold">
                {resetPage.fields.password}
                <input
                  className={inputClass}
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  required
                />
              </label>
              <label className="block text-sm font-semibold">
                {resetPage.fields.confirmPassword}
                <input
                  className={inputClass}
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  required
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
              >
                {resetPage.action}
              </button>
              <p className="text-xs leading-relaxed text-fg-subtle">
                {resetPage.rule}
              </p>
            </form>
          )}

          <p className="mt-5 text-center text-sm">
            <Link className="font-bold text-primary" href={`/dang-nhap${nextQuery}`}>
              {resetPage.backToSignIn}
            </Link>
          </p>
        </Card>
      </div>
    </Section>
  );
}
