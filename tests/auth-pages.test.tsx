import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * These pages were previously only tested at the server-action layer
 * (registration-action.test.ts etc.) — nothing rendered the page component
 * itself, so a broken `searchParams` branch (e.g. a typo'd `error`/`sent`
 * flag, or the register page's signed-in redirect) had no coverage.
 */

class RedirectSignal extends Error {
  constructor(readonly url: string) {
    super(url);
  }
}

const mocks = vi.hoisted(() => ({ auth: vi.fn(), redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import RegisterPage from "@/app/dang-ky-tai-khoan/page";
import ForgotPasswordPage from "@/app/quen-mat-khau/page";
import ResetPasswordPage from "@/app/dat-lai-mat-khau/page";
import VerifyEmailPage from "@/app/xac-thuc-email/page";

beforeEach(() => {
  mocks.auth.mockReset();
  mocks.redirect.mockReset();
  mocks.redirect.mockImplementation((url: string) => {
    throw new RedirectSignal(url);
  });
});

describe("/dang-ky-tai-khoan", () => {
  it("renders the registration form for a signed-out visitor", async () => {
    mocks.auth.mockResolvedValue(null);
    const element = await RegisterPage({
      searchParams: Promise.resolve({}),
    } as never);
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Tạo tài khoản");
    expect(html).toContain('name="email"');
    expect(html).toContain('name="password"');
    expect(html).toContain('name="confirmPassword"');
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects a signed-in visitor to the dashboard instead of rendering the form", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    await expect(
      RegisterPage({ searchParams: Promise.resolve({}) } as never),
    ).rejects.toMatchObject({ url: "/tai-khoan" });
  });

  it("shows the generic sent/error copy without echoing which one applied to a real account", async () => {
    mocks.auth.mockResolvedValue(null);
    const sentHtml = renderToStaticMarkup(
      await RegisterPage({
        searchParams: Promise.resolve({ sent: "1" }),
      } as never),
    );
    expect(sentHtml).toContain("HDI đã gửi hướng dẫn xác thực");

    const errorHtml = renderToStaticMarkup(
      await RegisterPage({
        searchParams: Promise.resolve({ error: "invalid" }),
      } as never),
    );
    expect(errorHtml).toContain("Vui lòng kiểm tra họ tên, email và mật khẩu");
  });
});

describe("/quen-mat-khau", () => {
  it("renders the request form and the generic sent notice", async () => {
    const html = renderToStaticMarkup(
      await ForgotPasswordPage({
        searchParams: Promise.resolve({}),
      } as never),
    );
    expect(html).toContain("Quên mật khẩu");
    expect(html).toContain('name="email"');

    const sentHtml = renderToStaticMarkup(
      await ForgotPasswordPage({
        searchParams: Promise.resolve({ sent: "1" }),
      } as never),
    );
    expect(sentHtml).toContain("Nếu email đã đăng ký");
  });
});

describe("/dat-lai-mat-khau", () => {
  it("renders the reset form only when a token is present in the URL", async () => {
    const withToken = renderToStaticMarkup(
      await ResetPasswordPage({
        searchParams: Promise.resolve({ token: "abc123" }),
      } as never),
    );
    expect(withToken).toContain('name="password"');
    expect(withToken).toContain('value="abc123"');

    const withoutToken = renderToStaticMarkup(
      await ResetPasswordPage({
        searchParams: Promise.resolve({}),
      } as never),
    );
    expect(withoutToken).not.toContain('name="password"');
    expect(withoutToken).toContain("Liên kết không hợp lệ");
  });

  it("treats a non-string token (repeated query param) as absent rather than passing it through", async () => {
    const html = renderToStaticMarkup(
      await ResetPasswordPage({
        searchParams: Promise.resolve({ token: ["a", "b"] }),
      } as never),
    );
    expect(html).not.toContain('name="password"');
  });
});

describe("/xac-thuc-email", () => {
  it("shows the verify button when a token is present, and the resend form otherwise", async () => {
    const withToken = renderToStaticMarkup(
      await VerifyEmailPage({
        searchParams: Promise.resolve({ token: "xyz" }),
      } as never),
    );
    expect(withToken).toContain("Xác thực email này");
    expect(withToken).not.toContain('name="email"');

    const withoutToken = renderToStaticMarkup(
      await VerifyEmailPage({
        searchParams: Promise.resolve({}),
      } as never),
    );
    expect(withoutToken).toContain('name="email"');
    expect(withoutToken).toContain("Gửi lại email xác thực");
  });
});
