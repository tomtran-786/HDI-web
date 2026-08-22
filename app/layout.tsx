import type { Metadata } from "next";
import { headers } from "next/headers";
import { Source_Sans_3 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/components/cart-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { themeBootstrap } from "@/lib/theme-script";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  // the page is in Vietnamese — without this subset the diacritics fall back
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HDI Research Center — Huấn luyện nghiên cứu & công bố quốc tế",
  description:
    "Chương trình kèm cặp nghiên cứu và công bố quốc tế do Dr. Cong Tam Trinh (PhD in Economics, Deakin University) dẫn dắt.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Nonce do middleware.ts sinh. Đọc headers() ở đây là lý do mọi route được
  // render động thay vì tĩnh — xem lib/security-headers.ts để biết vì sao CSP
  // của Next không thể dùng hash thay cho nonce.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    // the bootstrap script below adds `dark` before React hydrates
    <html
      lang="vi"
      className={`${sourceSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-bg text-fg">
        {/* SessionProvider, not `await auth()` here: reading the session on the
            server would opt every route — including the marketing page — out of
            static rendering. The header resolves the session on the client and
            falls back to the marketing CTA while it loads. */}
        <SessionProvider>
          {/* The cart lives in a cookie, so it wraps the header badge and the
              shared modal. The modal loads its catalog only after opening and
              gates selection behind authentication/profile completion. */}
          <CartProvider>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </CartProvider>
        </SessionProvider>
        {/* Page views plus the three funnel events in lib/analytics.ts. */}
        <Analytics />
      </body>
    </html>
  );
}
