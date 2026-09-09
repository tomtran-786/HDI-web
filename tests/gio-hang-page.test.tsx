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

import CartPage from "@/app/gio-hang/page";

beforeEach(() => {
  mocks.currentSession.mockReset();
  mocks.currentProfile.mockReset();
  mocks.isProfileComplete.mockReset();
});

describe("trang /gio-hang", () => {
  it("chưa đăng nhập → chuyển sang /dang-nhap kèm tiep=/gio-hang", async () => {
    mocks.currentSession.mockResolvedValue(null);
    await expect(CartPage()).rejects.toThrow("redirect:/dang-nhap?tiep=%2Fgio-hang");
  });

  it("hồ sơ chưa đủ → chuyển sang /hoan-tat-ho-so kèm tiep=/gio-hang", async () => {
    mocks.currentSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.currentProfile.mockResolvedValue({ id: "user-1" });
    mocks.isProfileComplete.mockReturnValue(false);
    await expect(CartPage()).rejects.toThrow(
      "redirect:/hoan-tat-ho-so?tiep=%2Fgio-hang",
    );
  });

  it("đã đăng nhập, hồ sơ đủ → vẽ tiêu đề giỏ hàng và gắn CartClient", async () => {
    mocks.currentSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.currentProfile.mockResolvedValue({ id: "user-1" });
    mocks.isProfileComplete.mockReturnValue(true);

    const html = renderToStaticMarkup(await CartPage());

    expect(html).toContain("Giỏ hàng");
    expect(html).toContain("CART_CLIENT_SENTINEL");
  });
});
