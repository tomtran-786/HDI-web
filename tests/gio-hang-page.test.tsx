import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentSession: vi.fn(),
  currentProfile: vi.fn(),
  isProfileComplete: vi.fn(),
}));

vi.mock("@/lib/current-session", () => ({ currentSession: mocks.currentSession }));
vi.mock("@/lib/current-profile", () => ({ currentProfile: mocks.currentProfile }));
vi.mock("@/lib/profile", () => ({ isProfileComplete: mocks.isProfileComplete }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
// The interactive cart is exercised by tests/cart-*.test.tsx; here we only care
// that the page gates correctly and mounts it.
vi.mock("@/app/gio-hang/cart-client", () => ({
  CartClient: () => <p>CART_CLIENT_SENTINEL</p>,
}));
vi.mock("@/app/gio-hang/cart-item-count", () => ({
  CartItemCount: () => <span>COUNT_SENTINEL</span>,
}));

import CartPage from "@/app/gio-hang/page";

/** Trang nhận `searchParams` là một Promise; mọi test đi qua đúng cửa này. */
function render(course?: string) {
  return CartPage({
    searchParams: Promise.resolve(course === undefined ? {} : { course }),
  });
}

beforeEach(() => {
  mocks.currentSession.mockReset();
  mocks.currentProfile.mockReset();
  mocks.isProfileComplete.mockReset();
});

describe("trang /gio-hang", () => {
  it("chưa đăng nhập → chuyển sang /dang-nhap kèm tiep=/gio-hang", async () => {
    mocks.currentSession.mockResolvedValue(null);
    await expect(render()).rejects.toThrow("redirect:/dang-nhap?tiep=%2Fgio-hang");
  });

  it("hồ sơ chưa đủ → chuyển sang /hoan-tat-ho-so kèm tiep=/gio-hang", async () => {
    mocks.currentSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.currentProfile.mockResolvedValue({ id: "user-1" });
    mocks.isProfileComplete.mockReturnValue(false);
    await expect(render()).rejects.toThrow(
      "redirect:/hoan-tat-ho-so?tiep=%2Fgio-hang",
    );
  });

  it("đã đăng nhập, hồ sơ đủ → đầu trang phẳng có breadcrumb + h1 và gắn CartClient", async () => {
    mocks.currentSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.currentProfile.mockResolvedValue({ id: "user-1" });
    mocks.isProfileComplete.mockReturnValue(true);

    const html = renderToStaticMarkup(await render());

    // `Trang chủ › Giỏ hàng`, tiêu đề trang là mục cuối của breadcrumb.
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('href="/"');
    expect(html).toMatch(/<h1[^>]*>Giỏ hàng<\/h1>/);
    expect(html.indexOf("Trang chủ")).toBeLessThan(html.indexOf("<h1"));
    expect(html).toContain("COUNT_SENTINEL");
    expect(html).toContain("CART_CLIENT_SENTINEL");
    // Không còn hero ảnh nền của PageBackdrop.
    expect(html).not.toContain("work-bg.jpg");
    expect(html).not.toContain("Chọn các khóa còn chỗ");
  });

  it("không có hồ sơ → chuyển thẳng về /dang-nhap", async () => {
    mocks.currentSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.currentProfile.mockResolvedValue(null);

    await expect(render()).rejects.toThrow("redirect:/dang-nhap");
    expect(mocks.isProfileComplete).not.toHaveBeenCalled();
  });

  /**
   * `?course=` phải sống sót qua cả hai cổng.
   *
   * Đường 401/409 phía client (`cartReturnTo` trong cart-client.tsx) vẫn giữ
   * slug; cổng server ở đây từng vứt nó đi, nên cùng một trang có hai hành vi
   * và người bấm "Đăng ký học khóa này" lúc chưa đăng nhập quay lại một giỏ
   * hàng không cuộn tới khóa họ vừa chọn.
   */
  it("giữ ?course= khi đẩy qua cổng đăng nhập", async () => {
    mocks.currentSession.mockResolvedValue(null);
    await expect(render("tieu-luan")).rejects.toThrow(
      "redirect:/dang-nhap?tiep=%2Fgio-hang%3Fcourse%3Dtieu-luan",
    );
  });

  it("giữ ?course= khi đẩy qua cổng hoàn tất hồ sơ", async () => {
    mocks.currentSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.currentProfile.mockResolvedValue({ id: "user-1" });
    mocks.isProfileComplete.mockReturnValue(false);

    await expect(render("tieu-luan")).rejects.toThrow(
      "redirect:/hoan-tat-ho-so?tiep=%2Fgio-hang%3Fcourse%3Dtieu-luan",
    );
  });
});
