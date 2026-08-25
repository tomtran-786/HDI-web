import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { COURSE_SLUGS } from "@/content/course";
import { SERVICE_SLUGS } from "@/content/services";
import { appUrl } from "@/lib/app-url";

describe("sitemap công khai", () => {
  it("liệt kê hub và đủ sáu trang chi tiết khóa học", () => {
    const urls = sitemap().map((entry) => entry.url);
    const base = appUrl();

    expect(urls).toContain(`${base}/khoa-hoc`);
    expect(urls.filter((url) => url.startsWith(`${base}/khoa-hoc/`))).toEqual(
      COURSE_SLUGS.map((slug) => `${base}/khoa-hoc/${slug}`),
    );
  });

  it("liệt kê hub, năm landing dịch vụ và giữ route AI chuyên biệt", () => {
    const urls = sitemap().map((entry) => entry.url);
    const base = appUrl();

    expect(urls).toContain(`${base}/dich-vu`);
    expect(urls.filter((url) => url.startsWith(`${base}/dich-vu/`))).toEqual(
      SERVICE_SLUGS.map((slug) => `${base}/dich-vu/${slug}`),
    );
    expect(urls).toContain(`${base}/kiem-tra-ai-dao-van`);
    expect(urls.some((url) => url.includes("/ket-qua/"))).toBe(false);
  });
});
