import type { Metadata } from "next";
import Link from "next/link";
import { findVerifyRecipient } from "@/lib/auth-tokens";
import { safeNext } from "@/lib/safe-path";
import { verifyPage } from "@/content/auth";
import { Section, SectionHeading } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { IconCheck, IconMail } from "@/components/ui/icons";
import { resendVerification, verifyEmail } from "./actions";

export const metadata: Metadata = {
  title: "Xác thực email — HDI Research Center",
  robots: { index: false, follow: false },
};

const inputClass =
  "mt-1.5 w-full rounded-card border border-line bg-bg px-4 py-3 text-sm text-fg outline-none transition focus:border-primary";

const primaryButton =
  "w-full rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep";

function ResendForm({ next }: { next: string }) {
  return (
    <form action={resendVerification} className="space-y-4">
      <input type="hidden" name="tiep" value={next} />
      <label className="block text-sm font-semibold">
        {verifyPage.resend.label}
        <input className={inputClass} name="email" type="email" autoComplete="email" required />
      </label>
      <button type="submit" className={primaryButton}>
        {verifyPage.resend.action}
      </button>
      <p className="text-xs leading-relaxed text-fg-subtle">
        {verifyPage.resend.hint}
      </p>
    </form>
  );
}

export default async function VerifyEmailPage({
  searchParams,
}: PageProps<"/xac-thuc-email">) {
  const { token, error, sent, tiep } = await searchParams;
  const safeToken = typeof token === "string" ? token : "";
  const next = safeNext(tiep);
  const nextQuery =
    next === "/tai-khoan" ? "" : `?tiep=${encodeURIComponent(next)}`;

  // Resolved on GET but never consumed — see findVerifyRecipient. A token that
  // no longer resolves is reported as such here rather than behind a button
  // press that was always going to fail.
  const recipient = safeToken ? await findVerifyRecipient(safeToken) : null;
  const brokenLink = Boolean(error) || (Boolean(safeToken) && !recipient);

  return (
    <Section soft>
      <div className="mx-auto max-w-md">
        <SectionHeading
          align="center"
          eyebrow={verifyPage.eyebrow}
          title={verifyPage.title}
          subtitle={verifyPage.subtitle}
        />

        <Card className="p-6 sm:p-8" hover={false}>
          {sent ? (
            /* The form is replaced, not merely captioned: leaving an empty
               field under a "sent" notice invites a second and third press,
               which is exactly what burns the 3-per-hour allowance. */
            <div>
              <p className="flex items-start gap-2 text-lg font-bold tracking-tight text-success">
                <IconCheck size={20} className="mt-0.5 shrink-0" />
                {verifyPage.sent.title}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                {verifyPage.sent.body}
              </p>
              <p className="mt-3 rounded-card border border-line bg-bg-soft px-4 py-3 text-xs leading-relaxed text-fg-subtle">
                {verifyPage.sent.limitNote}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <Link
                  className="text-sm font-bold text-primary underline underline-offset-4"
                  href={`/xac-thuc-email${nextQuery}`}
                >
                  {verifyPage.sent.again}
                </Link>
                <Link className="text-sm font-bold text-primary" href={`/dang-nhap${nextQuery}`}>
                  {verifyPage.backToSignIn}
                </Link>
              </div>
            </div>
          ) : recipient ? (
            <div>
              <p className="text-sm text-fg-muted">{verifyPage.confirm.lead}</p>
              <p className="mt-1 flex items-center gap-2 text-lg font-bold tracking-tight text-fg">
                <IconMail size={18} className="shrink-0 text-primary" />
                {recipient.maskedEmail}
              </p>

              <form action={verifyEmail} className="mt-6">
                <input type="hidden" name="token" value={safeToken} />
                <input type="hidden" name="tiep" value={next} />
                <button type="submit" className={primaryButton}>
                  {verifyPage.confirm.action}
                </button>
              </form>

              <p className="mt-4 text-xs leading-relaxed text-fg-subtle">
                {verifyPage.confirm.why}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-danger">
                {verifyPage.confirm.warning}
              </p>
            </div>
          ) : (
            <div>
              {brokenLink && (
                <div className="mb-5">
                  <p className="text-sm font-bold text-danger">
                    {verifyPage.invalid.title}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                    {verifyPage.invalid.body}
                  </p>
                </div>
              )}
              <ResendForm next={next} />
            </div>
          )}

          {!sent && (
            <p className="mt-5 text-center text-sm">
              <Link className="font-bold text-primary" href={`/dang-nhap${nextQuery}`}>
                {verifyPage.backToSignIn}
              </Link>
            </p>
          )}
        </Card>
      </div>
    </Section>
  );
}
