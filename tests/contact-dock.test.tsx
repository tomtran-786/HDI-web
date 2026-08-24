import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { composeEmailHref, contact, links } from "@/content/site";

vi.mock("@/lib/analytics", () => ({ trackCta: vi.fn() }));

import { ContactDock } from "@/components/contact-dock";

describe("contact dock", () => {
  it("render các kênh có href và ẩn fanpage chưa cấu hình", () => {
    const html = renderToStaticMarkup(<ContactDock />);

    expect(html).toContain(links.zalo);
    expect(html).toContain(contact.phoneHref);
    expect(html).toContain(composeEmailHref().replaceAll("&", "&amp;"));
    expect(html).not.toContain("Fanpage HDI");
    expect(html).toContain('aria-expanded="false"');
  });
});
