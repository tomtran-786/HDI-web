import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/lib/analytics", () => ({
  trackCta: vi.fn(),
  trackCartAdd: vi.fn(),
  trackCartRemove: vi.fn(),
  trackCheckout: vi.fn(),
}));
vi.mock("@/app/actions/checkout", () => ({ checkout: vi.fn() }));
vi.mock("@/components/cart-button", () => ({ CartButton: () => null }));

import { Avatar } from "@/components/ui/avatar";
import { SiteHeader } from "@/components/site-header";

const GOOGLE = "https://lh3.googleusercontent.com/a/ACg8ocK=s96-c";

describe("Avatar", () => {
  it("render ảnh Google, không gửi referrer sang Google", () => {
    const html = renderToStaticMarkup(
      <Avatar src={GOOGLE} name="Trịnh Công Tâm" email="tam@example.com" />,
    );

    expect(html).toContain(`src="${GOOGLE}"`);
    expect(html).toContain('referrerPolicy="no-referrer"');
    // Tên đã nằm ngay cạnh ảnh ở mọi chỗ dùng, nên alt để rỗng.
    expect(html).toContain('alt=""');
  });

  it("lùi về chữ cái khi tài khoản chưa có ảnh", () => {
    const html = renderToStaticMarkup(
      <Avatar src={null} name="Trịnh Công Tâm" email="tam@example.com" />,
    );

    expect(html).not.toContain("<img");
    expect(html).toContain("TT");
  });

  it("KHÔNG render URL ngoài host đã cho phép", () => {
    // Hàng cũ trong database có thể mang URL từ trước khi có bộ lọc. Ở đây nó
    // phải rơi về chữ cái chứ không được thành một thẻ <img> trỏ ra ngoài.
    const html = renderToStaticMarkup(
      <Avatar src="https://evil.example/a.png" name="Tâm" email="t@e.com" />,
    );

    expect(html).not.toContain("evil.example");
    expect(html).toContain("T");
  });
});

describe("ảnh đại diện trên navbar", () => {
  it("hiện cùng lối vào trang tài khoản", () => {
    const html = renderToStaticMarkup(
      <SiteHeader
        signedIn
        user={{ name: "Trịnh Công Tâm", email: "tam@example.com", image: GOOGLE }}
      />,
    );

    expect(html).toContain(`src="${GOOGLE}"`);
    expect(html).toContain('href="/tai-khoan"');
  });

  it("không có gì để hiện với khách chưa đăng nhập", () => {
    const html = renderToStaticMarkup(<SiteHeader signedIn={false} />);

    expect(html).not.toContain("googleusercontent.com");
  });

  it("vẫn vẽ được ô tài khoản khi phiên không kèm ảnh", () => {
    const html = renderToStaticMarkup(<SiteHeader signedIn />);

    expect(html).toContain('href="/tai-khoan"');
    expect(html).not.toContain("<img src=\"undefined\"");
  });
});
