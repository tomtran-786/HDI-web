import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));
vi.mock("@/lib/analytics", () => ({ trackCta: vi.fn() }));

import { SiteFooter } from "@/components/site-footer";
import { links } from "@/content/site";

beforeEach(() => {
  mocks.pathname = "/";
});

describe("thẻ đặt lịch tư vấn ở footer", () => {
  it("ẩn trên trang chủ vì đã có mục Liên hệ ngay phía trên", () => {
    const html = renderToStaticMarkup(<SiteFooter />);
    expect(html).not.toContain("Nhắn Zalo");
    expect(html).not.toContain("Đặt lịch");
  });

  it("hiện ở trang khác, dẫn tới #lien-he và Zalo", () => {
    mocks.pathname = "/khoa-hoc/viet-bai-tap-chi";
    const html = renderToStaticMarkup(<SiteFooter />);
    expect(html).toContain("Nhắn Zalo");
    expect(html).toContain(`href="${links.zalo}"`);
    expect(html).toContain('href="/#lien-he"');
    expect(html.replace(/<[^>]+>/g, "")).toContain("Đặt lịch tư vấn miễn phí");
  });

  it("footer là band navy, giữ link Trang cũ và có icon MXH", () => {
    const html = renderToStaticMarkup(<SiteFooter />);
    expect(html).toMatch(/<footer[^>]*class="band /);
    expect(html).toContain("Trang cũ (Google Sites)");
    for (const label of ["Facebook", "TikTok", "Linktree"]) {
      expect(html).toContain(`aria-label="${label}"`);
    }
  });
});
