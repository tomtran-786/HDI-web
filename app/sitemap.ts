import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/app-url";

/**
 * The public site is one landing page whose sections are hash anchors, plus the
 * adviser's academic record at /cong-bo and the two doors into an account. Hash fragments are not separate URLs, so listing
 * "/" once is the whole map — adding #chuong-trinh and friends would just be
 * duplicate entries pointing at the same document.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  const lastModified = new Date();
  return [
    { url: base, lastModified, changeFrequency: "weekly", priority: 1 },
    {
      url: `${base}/cong-bo`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/dang-ky-tai-khoan`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/dang-nhap`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
