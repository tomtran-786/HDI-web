import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/app-url";

/**
 * Everything behind authentication is disallowed: those pages hold a student's
 * orders and Drive links, they render nothing useful to a crawler, and the
 * one-time token pages (/xac-thuc-email, /dat-lai-mat-khau) carry a secret in
 * the query string that has no business landing in an index.
 */
export default function robots(): MetadataRoute.Robots {
  const base = appUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/quan-tri",
        "/tai-khoan",
        "/hoan-tat-ho-so",
        "/thanh-toan",
        "/xac-thuc-email",
        "/dat-lai-mat-khau",
        "/quen-mat-khau",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
