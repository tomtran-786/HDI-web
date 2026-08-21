import type { Metadata } from "next";
import Link from "next/link";
import { forgotPage } from "@/content/auth";
import { safeNext } from "@/lib/safe-path";
import { Section, SectionHeading } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { IconCheck } from "@/components/ui/icons";
import { requestPasswordReset } from "./actions";

export const metadata: Metadata = {
  title: "Quên mật khẩu — HDI Research Center",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage({
  searchParams,
}: PageProps<"/quen-mat-khau">) {
  const { sent, tiep } = await searchParams;
  const next = safeNext(tiep);
  const nextQuery =
    next === "/tai-khoan" ? "" : `?tiep=${encodeURIComponent(next)}`;

  return (
    <Section soft>
      <div className="mx-auto max-w-md">
        <SectionHeading
          align="center"
          eyebrow={forgotPage.eyebrow}
          title={sent ? forgotPage.sent.title : forgotPage.title}
          subtitle={sent ? undefined : forgotPage.subtitle}
        />

        <Card className="p-6 sm:p-8" hover={false}>
          {sent ? (
            /* Same reasoning as /xac-thuc-email: an empty field left under a
               "sent" notice invites the presses that use up the three sends
               this email address gets in an hour. */
            <div>
              <p className="flex items-start gap-2 text-sm leading-relaxed text-fg-muted">
                <IconCheck size={18} className="mt-0.5 shrink-0 text-success" />
                {forgotPage.sent.body}
              </p>
              <p className="mt-3 rounded-card border border-line bg-bg-soft px-4 py-3 text-xs leading-relaxed text-fg-subtle">
                {forgotPage.sent.limitNote}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <Link
                  className="text-sm font-bold text-primary underline underline-offset-4"
                  href={`/quen-mat-khau${nextQuery}`}
                >
                  {forgotPage.sent.again}
                </Link>
                <Link className="text-sm font-bold text-primary" href={`/dang-nhap${nextQuery}`}>
                  {forgotPage.backToSignIn}
                </Link>
              </div>
            </div>
          ) : (
            <>
              <form action={requestPasswordReset} className="space-y-4">
                <input type="hidden" name="tiep" value={next} />
                <label className="block text-sm font-semibold">
                  {forgotPage.label}
                  <input
                    className="mt-1.5 w-full rounded-card border border-line bg-bg px-4 py-3 text-sm outline-none transition focus:border-primary"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </label>
                <button
                  type="submit"
                  className="w-full rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
                >
                  {forgotPage.action}
                </button>
                <p className="text-xs leading-relaxed text-fg-subtle">
                  {forgotPage.hint}
                </p>
              </form>

              <p className="mt-5 text-center text-sm">
                <Link className="font-bold text-primary" href={`/dang-nhap${nextQuery}`}>
                  {forgotPage.backToSignIn}
                </Link>
              </p>
            </>
          )}
        </Card>
      </div>
    </Section>
  );
}
