import type { Metadata } from "next";
import { AuthError } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { safeNext } from "@/lib/safe-path";
import { signInPage } from "@/content/auth";
import { Section, SectionHeading } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { IconCheck, IconGoogle } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Đăng nhập — HDI Research Center",
  // A sign-in screen has nothing to offer a search engine and every reason to
  // stay out of the index.
  robots: { index: false, follow: false },
};

const inputClass =
  "mt-1.5 w-full rounded-card border border-line bg-bg px-4 py-3 text-sm outline-none transition focus:border-primary";

export default async function SignInPage({
  searchParams,
}: PageProps<"/dang-nhap">) {
  const { error, tiep, verified, reset } = await searchParams;
  // Where to land afterwards. Checkout sends people here mid-purchase, and
  // dropping them on the dashboard instead of back at their cart is how a
  // filled cart gets abandoned.
  const next = safeNext(tiep);
  const nextQuery =
    next === "/tai-khoan" ? "" : `?tiep=${encodeURIComponent(next)}`;

  const session = await auth();
  if (session?.user) redirect(next);

  return (
    <Section soft>
      <div className="mx-auto max-w-md">
        <SectionHeading
          align="center"
          eyebrow={signInPage.eyebrow}
          title={signInPage.title}
          subtitle={signInPage.subtitle}
        />

        <Card className="p-6 sm:p-8" hover={false}>
          {/* Good news and bad news no longer share one grey box. */}
          {(verified || reset) && (
            <p className="mb-5 flex items-start gap-2 rounded-card border border-line bg-bg-soft px-4 py-3 text-sm text-success">
              <IconCheck size={16} className="mt-0.5 shrink-0" />
              {verified ? signInPage.verified : signInPage.reset}
            </p>
          )}
          {error && (
            <p className="mb-5 rounded-card border border-line bg-bg-soft px-4 py-3 text-sm text-danger">
              {signInPage.error}
            </p>
          )}

          <form
            className="space-y-4"
            action={async (formData) => {
              "use server";
              try {
                await signIn("credentials", {
                  email: formData.get("email"),
                  password: formData.get("password"),
                  redirectTo: next,
                });
              } catch (authError) {
                if (authError instanceof AuthError) {
                  redirect(
                    `/dang-nhap?error=CredentialsSignin&tiep=${encodeURIComponent(next)}`,
                  );
                }
                throw authError;
              }
            }}
          >
            <label className="block text-sm font-semibold">
              {signInPage.fields.email}
              <input
                className={inputClass}
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </label>
            <label className="block text-sm font-semibold">
              {signInPage.fields.password}
              <input
                className={inputClass}
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
            >
              {signInPage.action}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-fg-subtle">
            <span className="h-px flex-1 bg-line" />
            {signInPage.or}
            <span className="h-px flex-1 bg-line" />
          </div>

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: next });
            }}
          >
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-line bg-bg px-6 py-3 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
            >
              <IconGoogle size={18} />
              {signInPage.google}
            </button>
          </form>

          <p className="mt-5 text-center text-xs leading-relaxed text-fg-subtle">
            {signInPage.driveNote}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
            <Link className="font-bold text-primary" href={`/dang-ky-tai-khoan${nextQuery}`}>
              {signInPage.links.register}
            </Link>
            <Link className="font-bold text-primary" href={`/quen-mat-khau${nextQuery}`}>
              {signInPage.links.forgot}
            </Link>
            <Link className="font-bold text-primary" href={`/xac-thuc-email${nextQuery}`}>
              {signInPage.links.resendVerify}
            </Link>
          </div>
        </Card>
      </div>
    </Section>
  );
}
