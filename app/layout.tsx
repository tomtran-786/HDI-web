import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
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

// Applied before paint so a dark-mode visitor never sees a white flash.
const themeBootstrap = `
try {
  var stored = localStorage.getItem("hdi-theme");
  var dark = stored ? stored === "dark"
    : window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (dark) document.documentElement.classList.add("dark");
} catch (e) {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // the bootstrap script below adds `dark` before React hydrates
    <html
      lang="vi"
      className={`${sourceSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-bg text-fg">
        {children}
      </body>
    </html>
  );
}
