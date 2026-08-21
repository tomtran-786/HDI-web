import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { registerPage } from "@/content/auth";
import { registerAccount } from "./actions";
import { Section, SectionHeading } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { IconMail } from "@/components/ui/icons";

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
          eyebrow={registerPage.eyebrow}
          title={sent ? registerPage.sent.title : registerPage.title}
          subtitle={sent ? undefined : registerPage.subtitle}
        />

        <Card className="p-6 sm:p-8" hover={false}>
          {sent ? (
            /* Registration succeeded, so the form has no further job. Rendering
               it again — empty — reads as a failed submit and gets filled in a
               second time, which spends another of the three hourly sends. */
            <div>
              <p className="flex items-start gap-2 text-sm leading-relaxed text-fg-muted">
                <IconMail size={18} className="mt-0.5 shrink-0 text-primary" />
                {registerPage.sent.body}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-fg-subtle">
                {registerPage.sent.spam}
              </p>
              <div className="mt-6 space-y-3">
                <Link
                  href="/xac-thuc-email"
                  className="block w-full rounded-full border border-line px-6 py-3 text-center text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
                >
                  {registerPage.sent.resendCta}
                </Link>
                <Link
                  href="/dang-nhap"
                  className="block w-full rounded-full bg-primary px-6 py-3 text-center text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
                >
                  {registerPage.sent.signInCta}
                </Link>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <p className="mb-5 rounded-card border border-line bg-bg-soft px-4 py-3 text-sm text-danger">
                  {registerPage.error}
                </p>
              )}

              <form action={registerAccount} className="space-y-4">
                <label className="block text-sm font-semibold">
                  {registerPage.fields.name}
                  <input className={inputClass} name="name" autoComplete="name" required minLength={2} maxLength={100} />
                </label>
                <label className="block text-sm font-semibold">
                  {registerPage.fields.email}
                  <input className={inputClass} name="email" type="email" autoComplete="email" required />
                </label>
                <label className="block text-sm font-semibold">
                  {registerPage.fields.password}
                  <input className={inputClass} name="password" type="password" autoComplete="new-password" required minLength={12} />
                </label>
                <label className="block text-sm font-semibold">
                  {registerPage.fields.confirmPassword}
                  <input className={inputClass} name="confirmPassword" type="password" autoComplete="new-password" required minLength={12} />
                </label>
                <button className="w-full rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep" type="submit">
                  {registerPage.action}
                </button>
              </form>

              <p className="mt-5 text-xs leading-relaxed text-fg-subtle">
                {registerPage.driveNote}
              </p>
              <p className="mt-5 text-center text-sm text-fg-muted">
                {registerPage.haveAccount}{" "}
                <Link className="font-bold text-primary" href="/dang-nhap">
                  {registerPage.signIn}
                </Link>
              </p>
            </>
          )}
        </Card>
      </div>
    </Section>
  );
}
