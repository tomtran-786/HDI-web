import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { safeNext } from "@/lib/safe-path";
import { Section, SectionHeading } from "@/components/ui/section";
import { IconGoogle } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Đăng nhập — HDI Research Center",
  // A sign-in screen has nothing to offer a search engine and every reason to
  // stay out of the index.
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: PageProps<"/dang-nhap">) {
  const { error, tiep } = await searchParams;
  // Where to land afterwards. Checkout sends people here mid-purchase, and
  // dropping them on the dashboard instead of back at their cart is how a
  // filled cart gets abandoned.
  const next = safeNext(tiep);

  const session = await auth();
  if (session?.user) redirect(next);

  return (
    <Section soft>
      <div className="mx-auto max-w-md">
        <SectionHeading
          align="center"
          eyebrow="Khu vực học viên"
          title="Đăng nhập"
          subtitle="Dùng tài khoản Google của bạn để vào lớp và xem lại record."
        />

        <div className="rounded-card border border-line bg-card p-6 sm:p-8">
          {error && (
            <p className="mb-5 rounded-card border border-line bg-bg-soft px-4 py-3 text-sm text-fg-muted">
              Đăng nhập chưa thành công. Vui lòng thử lại, hoặc nhắn Zalo nếu
              vẫn không vào được.
            </p>
          )}

          {/* A server action, so no client component and no JavaScript is
              needed to start the OAuth flow. */}
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
              Tiếp tục với Google
            </button>
          </form>

          {/* Not a formality: recordings are served from Google Drive, which
              grants access per Google account. Signing in with the address you
              actually watch from is what makes that work. */}
          <p className="mt-5 text-center text-xs leading-relaxed text-fg-subtle">
            Record khóa học được chia sẻ qua Google Drive, nên hãy đăng nhập
            bằng chính tài khoản Google bạn dùng để xem.
          </p>
        </div>
      </div>
    </Section>
  );
}
