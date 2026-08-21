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

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  redirect: vi.fn(),
  findVerifyRecipient: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/auth-tokens", () => ({
  findVerifyRecipient: mocks.findVerifyRecipient,
}));
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
  mocks.findVerifyRecipient.mockReset();
  mocks.findVerifyRecipient.mockResolvedValue(null);
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

  it("replaces the form with a check-your-inbox state after a successful submit", async () => {
    mocks.auth.mockResolvedValue(null);
    const sentHtml = renderToStaticMarkup(
      await RegisterPage({
        searchParams: Promise.resolve({ sent: "1" }),
      } as never),
    );

    expect(sentHtml).toContain("Kiểm tra hộp thư của bạn");
    // The empty form must be gone: re-rendering it reads as a failed submit and
    // costs another of the three hourly verification sends.
    expect(sentHtml).not.toContain('name="password"');
    expect(sentHtml).not.toContain('name="confirmPassword"');
    // And there is a way onward to a fresh link rather than a dead end.
    expect(sentHtml).toContain("/xac-thuc-email");
  });

  it("keeps the sent copy generic so it never confirms an address has an account", async () => {
    mocks.auth.mockResolvedValue(null);
    const sentHtml = renderToStaticMarkup(
      await RegisterPage({
        searchParams: Promise.resolve({ sent: "1" }),
      } as never),
    );
    expect(sentHtml).toContain("Nếu email có thể đăng ký");
  });

  it("shows the validation error alongside a form that can be corrected", async () => {
    mocks.auth.mockResolvedValue(null);
    const errorHtml = renderToStaticMarkup(
      await RegisterPage({
        searchParams: Promise.resolve({ error: "invalid" }),
      } as never),
    );
    expect(errorHtml).toContain("Vui lòng kiểm tra họ tên, email và mật khẩu");
    expect(errorHtml).toContain('name="password"');
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
  it("names the address and explains the extra click when the link still resolves", async () => {
    mocks.findVerifyRecipient.mockResolvedValue({
      maskedEmail: "ngu•••@example.com",
    });
    const html = renderToStaticMarkup(
      await VerifyEmailPage({
        searchParams: Promise.resolve({ token: "xyz" }),
      } as never),
    );

    expect(html).toContain("Xác thực email này");
    expect(html).toContain("ngu•••@example.com");
    // Why a second click exists at all — otherwise the page reads as an error.
    expect(html).toContain("bộ quét thư");
    expect(html).toContain('value="xyz"');
    expect(html).not.toContain('name="email"');
  });

  it("reports a dead link up front instead of behind a button that must fail", async () => {
    mocks.findVerifyRecipient.mockResolvedValue(null);
    const html = renderToStaticMarkup(
      await VerifyEmailPage({
        searchParams: Promise.resolve({ token: "stale" }),
      } as never),
    );

    expect(html).toContain("Liên kết không dùng được");
    expect(html).not.toContain("Xác thực email này");
    // …and offers the way out in the same breath.
    expect(html).toContain('name="email"');
  });

  it("shows the resend form with its rate limit stated when there is no token", async () => {
    const html = renderToStaticMarkup(
      await VerifyEmailPage({ searchParams: Promise.resolve({}) } as never),
    );
    expect(html).toContain('name="email"');
    expect(html).toContain("tối đa 3 liên kết mỗi giờ");
    expect(mocks.findVerifyRecipient).not.toHaveBeenCalled();
  });

  it("replaces the resend form after sending so the hourly allowance is not spent on retries", async () => {
    const html = renderToStaticMarkup(
      await VerifyEmailPage({
        searchParams: Promise.resolve({ sent: "1" }),
      } as never),
    );

    expect(html).toContain("Đã gửi nếu tài khoản đang chờ xác thực");
    expect(html).not.toContain('name="email"');
    expect(html).toContain("đợi hết giờ rồi thử lại");
  });

  it("never consumes the token while rendering", async () => {
    mocks.findVerifyRecipient.mockResolvedValue({ maskedEmail: "a•••@b.com" });
    await VerifyEmailPage({
      searchParams: Promise.resolve({ token: "xyz" }),
    } as never);
    // A GET may be issued by a mail scanner; verification must stay a POST.
    expect(mocks.findVerifyRecipient).toHaveBeenCalledWith("xyz");
  });
});
