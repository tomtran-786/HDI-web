import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/lib/analytics", () => ({
  trackCta: vi.fn(),
  trackCartAdd: vi.fn(),
  trackCartRemove: vi.fn(),
  trackCheckout: vi.fn(),
}));
// SiteHeader -> CartButton -> CartProvider -> CartModal -> app/actions/checkout
// -> lib/auth -> next-auth. Trong một build Next thật, server action chỉ còn là
// một tham chiếu ở phía client; vitest thì nạp cả nhánh, nên cắt ở đây.
vi.mock("@/app/actions/checkout", () => ({ checkout: vi.fn() }));
// CartButton đọc context của CartProvider, mà ở đây header được render đứng một
// mình. Nút giỏ hàng không liên quan gì tới thứ đang kiểm, nên thay bằng chỗ
// trống thay vì dựng cả provider.
vi.mock("@/components/cart-button", () => ({ CartButton: () => null }));

import { SiteHeader } from "@/components/site-header";
import { nav } from "@/content/site";

const render = (props: { signedIn: boolean; isAdmin?: boolean }) =>
  renderToStaticMarkup(<SiteHeader {...props} />);

describe("lối vào trang quản trị trên navbar", () => {
  it("hiện với tài khoản admin", () => {
    const html = render({ signedIn: true, isAdmin: true });

    expect(html).toContain('href="/quan-tri"');
    expect(html).toContain("Quản trị");
  });

  it("KHÔNG hiện với người đã đăng nhập nhưng không phải admin", () => {
    expect(render({ signedIn: true, isAdmin: false })).not.toContain("/quan-tri");
  });

  it("KHÔNG hiện với khách chưa đăng nhập", () => {
    expect(render({ signedIn: false })).not.toContain("/quan-tri");
  });

  it("mặc định là không phải admin khi prop bị bỏ trống", () => {
    // Giá trị mặc định phải nghiêng về phía ẩn: một lần quên truyền prop không
    // được biến thành một đường link quản trị hiện ra cho mọi khách.
    expect(render({ signedIn: true })).not.toContain("/quan-tri");
  });

  it("đứng CUỐI, sau mọi mục nội dung", () => {
    const html = render({ signedIn: true, isAdmin: true });
    const cuoiCungTrongNav = nav[nav.length - 1].href;

    expect(html.indexOf('href="/quan-tri"')).toBeGreaterThan(
      html.indexOf(`href="${cuoiCungTrongNav}"`),
    );
  });

  it("xuất hiện đúng một lần khi menu mobile đang đóng", () => {
    const html = render({ signedIn: true, isAdmin: true });

    // Menu mobile chỉ render khi `open` — renderToStaticMarkup cho ra trạng
    // thái đóng, nên ở đây chỉ thấy nav desktop. Việc mục quản trị cũng có mặt
    // trong menu mobile được bảo đảm bằng cấu trúc chứ không bằng test này: cả
    // hai chỗ cùng map trên một biến `navItems` duy nhất.
    expect(html.split('href="/quan-tri"').length - 1).toBe(1);
  });

  it("không rò xuống footer", () => {
    // `nav` dùng chung với site-footer.tsx, nên mục quản trị phải sống trong
    // site-header chứ không phải trong content/site.ts. Ép về string[] để so
    // sánh chạy được: `nav` là `as const`, và TypeScript vốn đã biết "/quan-tri"
    // không nằm trong đó — bản thân điều đó đã là một nửa lời bảo đảm.
    const hrefs: readonly string[] = nav.map((item) => item.href);

    expect(hrefs).not.toContain("/quan-tri");
  });
});
