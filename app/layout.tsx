import type { Metadata } from "next";
import { headers } from "next/headers";
import { Source_Sans_3 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/components/cart-provider";
import { CheckoutReclaim } from "@/components/checkout-reclaim";
import { ContactDock } from "@/components/contact-dock";
import { ScrollProgress } from "@/components/scroll-progress";
import { SiteHeader } from "@/components/site-header";
import { SiteBreadcrumbs } from "@/components/site-breadcrumbs";
import { SiteFooter } from "@/components/site-footer";
import { themeBootstrap } from "@/lib/theme-script";
import { appUrl } from "@/lib/app-url";
import { isAdminEmail } from "@/lib/auth";
import { currentSession } from "@/lib/current-session";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  // the page is in Vietnamese — without this subset the diacritics fall back
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const DESCRIPTION =
  "HDI Research Center là cộng đồng huấn luyện và hỗ trợ nghiên cứu dành cho sinh viên, học viên cao học, nghiên cứu sinh, giảng viên và nhà nghiên cứu trẻ, dưới sự định hướng chuyên môn của Dr. Tam Trinh – Lead Academic Advisor.";

export const metadata: Metadata = {
  // Without a base, Next resolves canonical and Open Graph URLs relative to
  // localhost, so a shared link would preview against the wrong host. The
  // origin comes from APP_URL — the same value the emails and PayOS callbacks
  // use — so a domain move never leaves the two disagreeing.
  metadataBase: new URL(appUrl()),
  title: "HDI Research Center — Huấn luyện nghiên cứu & công bố quốc tế",
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "/",
    siteName: "HDI Research Center",
    title: "HDI Research Center — Huấn luyện nghiên cứu & công bố quốc tế",
    description: DESCRIPTION,
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Nonce do middleware.ts sinh. Đọc headers() ở đây là lý do mọi route được
  // render động thay vì tĩnh — xem lib/security-headers.ts để biết vì sao CSP
  // của Next không thể dùng hash thay cho nonce.
  const [headerStore, session] = await Promise.all([headers(), currentSession()]);
  const nonce = headerStore.get("x-nonce") ?? undefined;
  const appShell = (
    <CartProvider>
      <ScrollProgress />
      <SiteHeader
        signedIn={Boolean(session?.user)}
        // Không tốn truy vấn nào: email đã nằm sẵn trong JWT, và
        // isAdminEmail chỉ đọc một biến môi trường.
        isAdmin={isAdminEmail(session?.user?.email)}
        // Ảnh đại diện Google đã nằm trong JWT — xem lib/auth.ts — nên ô tài
        // khoản trên navbar vẽ được mà không thêm truy vấn nào.
        user={
          session?.user
            ? {
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
              }
            : undefined
        }
      />
      <SiteBreadcrumbs />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <ContactDock signedIn={Boolean(session?.user?.id)} />
      {/* Không tốn gì cho khách thường: component tự dừng lại ngay khi thấy
          trình duyệt không mang dấu bàn giao PayOS nào. */}
      <CheckoutReclaim />
    </CartProvider>
  );

  return (
    // the bootstrap script below adds `dark` before React hydrates
    <html
      lang="vi"
      className={`${sourceSans.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-bg text-fg">
        {/* Nonce handling already makes every route dynamic. The header gets
            its state directly from the server, and authenticated pages seed
            SessionProvider for client sign-out. Anonymous pages need no auth
            context, so omitting it also avoids its development StrictMode
            refresh of /api/auth/session. */}
        {session ? (
          <SessionProvider session={session} refetchOnWindowFocus={false}>
            {appShell}
          </SessionProvider>
        ) : (
          appShell
        )}
        {/* Page views plus the three funnel events in lib/analytics.ts. */}
        <Analytics />
      </body>
    </html>
  );
}
