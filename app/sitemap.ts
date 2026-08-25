import type { MetadataRoute } from "next";
import { COURSE_SLUGS } from "@/content/course";
import { SERVICE_SLUGS } from "@/content/services";
import { appUrl } from "@/lib/app-url";

/**
 * Public marketing pages include the landing page, the HDI and academic-record
 * pages, the course hub and every authored course detail URL, plus the AI/
 * plagiarism service and the two doors into an account. Hash fragments remain
 * absent because they are not separate URLs.
 *
 * /kiem-tra-ai-dao-van/ket-qua/<ref> is deliberately absent: it is one person's
 * order, not a page to be found.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  const lastModified = new Date();
  const coursePages: MetadataRoute.Sitemap = COURSE_SLUGS.map((slug) => ({
    url: `${base}/khoa-hoc/${slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  const servicePages: MetadataRoute.Sitemap = SERVICE_SLUGS.map((slug) => ({
    url: `${base}/dich-vu/${slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  return [
    { url: base, lastModified, changeFrequency: "weekly", priority: 1 },
    {
      url: `${base}/ve-hdi`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/cong-bo`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/khoa-hoc`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...coursePages,
    {
      url: `${base}/dich-vu`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...servicePages,
    {
      url: `${base}/kiem-tra-ai-dao-van`,
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
