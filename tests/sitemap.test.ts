import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ publicAvailability: vi.fn() }));
vi.mock("@/lib/course-sales", () => ({
  publicAvailability: mocks.publicAvailability,
}));

import sitemap from "@/app/sitemap";
import { COURSE_SLUGS } from "@/content/course";
import { SERVICE_SLUGS } from "@/content/services";
import { appUrl } from "@/lib/app-url";

const allOpen = Object.fromEntries(
  COURSE_SLUGS.map((slug) => [slug, "buyable" as const]),
);

describe("sitemap công khai", () => {
  beforeEach(() => {
    mocks.publicAvailability.mockReset();
    mocks.publicAvailability.mockResolvedValue(allOpen);
  });

  it("liệt kê hub và mọi trang chi tiết khóa đang mở bán", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    const base = appUrl();

    expect(urls).toContain(`${base}/khoa-hoc`);
    expect(urls.filter((url) => url.startsWith(`${base}/khoa-hoc/`))).toEqual(
      COURSE_SLUGS.map((slug) => `${base}/khoa-hoc/${slug}`),
    );
  });

  it("liệt kê các trang nội dung tĩnh dưới 'Về HDI'", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    const base = appUrl();

    expect(urls).toContain(`${base}/cong-bo`);
    expect(urls).toContain(`${base}/hoi-thao-quoc-te`);
  });

  it("liệt kê hub, năm landing dịch vụ và giữ route AI chuyên biệt", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    const base = appUrl();

    expect(urls).toContain(`${base}/dich-vu`);
    expect(urls.filter((url) => url.startsWith(`${base}/dich-vu/`))).toEqual(
      SERVICE_SLUGS.map((slug) => `${base}/dich-vu/${slug}`),
    );
    expect(urls).toContain(`${base}/kiem-tra-ai-dao-van`);
    expect(urls.some((url) => url.includes("/ket-qua/"))).toBe(false);
  });

  it("bỏ khóa chưa mở bán nhưng giữ khóa hết chỗ", async () => {
    const [closed, full, ...rest] = COURSE_SLUGS;
    mocks.publicAvailability.mockResolvedValue({
      ...Object.fromEntries(rest.map((slug) => [slug, "buyable"])),
      [closed]: "not_open",
      [full]: "full",
    });
    const urls = (await sitemap()).map((entry) => entry.url);
    const base = appUrl();

    expect(urls).not.toContain(`${base}/khoa-hoc/${closed}`);
    expect(urls).toContain(`${base}/khoa-hoc/${full}`);
    expect(urls).toContain(`${base}/khoa-hoc`);
  });

  it("coi khóa không có dòng trong DB là chưa mở bán", async () => {
    const [missing, ...rest] = COURSE_SLUGS;
    mocks.publicAvailability.mockResolvedValue(
      Object.fromEntries(rest.map((slug) => [slug, "buyable"])),
    );
    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).not.toContain(`${appUrl()}/khoa-hoc/${missing}`);
  });

  it("DB lỗi thì giữ đủ khóa thay vì làm sitemap trống", async () => {
    mocks.publicAvailability.mockRejectedValue(new Error("db offline"));
    const urls = (await sitemap()).map((entry) => entry.url);

    expect(
      urls.filter((url) => url.startsWith(`${appUrl()}/khoa-hoc/`)),
    ).toHaveLength(COURSE_SLUGS.length);
  });
});
