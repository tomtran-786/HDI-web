import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { composeEmailHref, contact, links } from "@/content/site";

vi.mock("@/lib/analytics", () => ({ trackCta: vi.fn() }));
// Dock đóng ở SSR nên modal không render; mock module để unit test này không
// kéo toàn bộ Auth.js/server action vào môi trường Node tối thiểu của Vitest.
vi.mock("@/components/feedback-modal", () => ({ FeedbackModal: () => null }));

import { ContactDock } from "@/components/contact-dock";

describe("contact dock", () => {
  it("render mọi kênh đã cấu hình href", () => {
    const html = renderToStaticMarkup(<ContactDock signedIn={false} />);

    expect(html).toContain(links.zalo);
    expect(html).toContain(contact.phoneHref);
    expect(html).toContain(composeEmailHref().replaceAll("&", "&amp;"));
    expect(html).toContain("Fanpage HDI");
    expect(html).toContain(links.fanpage.replaceAll("&", "&amp;"));
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("Báo lỗi hoặc góp ý cho HDI");
    expect(html).toMatchSnapshot();
  });

  it.each([false, true])(
    "bubble feedback luôn hiện khi signedIn=%s",
    (signedIn) => {
      const html = renderToStaticMarkup(<ContactDock signedIn={signedIn} />);
      expect(html).toContain("Báo lỗi hoặc góp ý cho HDI");
    },
  );

  it("dialog không nằm trong data-contact-dock ở markup server", () => {
    const html = renderToStaticMarkup(<ContactDock signedIn />);
    expect(html).not.toContain("<dialog");
  });
});
