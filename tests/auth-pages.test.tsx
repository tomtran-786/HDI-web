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
  signIn: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth, signIn: mocks.signIn }));
// The sign-in page imports AuthError as a value, which drags in next-auth's
// runtime and its next/server resolution. The page only ever uses it for an
// instanceof check, so a bare class stands in fine.
vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));
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
import SignInPage from "@/app/dang-nhap/page";

beforeEach(() => {
  mocks.auth.mockReset();
  mocks.redirect.mockReset();
  mocks.signIn.mockReset();
  mocks.findVerifyRecipient.mockReset();
  mocks.findVerifyRecipient.mockResolvedValue(null);
  mocks.auth.mockResolvedValue(null);
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

  it("preserves the landing cart return through registration and verification", async () => {
    const next = "/?cart=1&course=viet-bao-cao-khoa-hoc";
    const html = renderToStaticMarkup(
      await RegisterPage({
        searchParams: Promise.resolve({ tiep: next }),
      } as never),
    );
    expect(html).toContain('name="tiep"');
    expect(html).toContain("%2F%3Fcart%3D1%26course%3Dviet-bao-cao-khoa-hoc");
  });
});

describe("/quen-mat-khau", () => {
  it("renders the request form with its rate limit and link lifetime stated", async () => {
    const html = renderToStaticMarkup(
      await ForgotPasswordPage({
        searchParams: Promise.resolve({}),
      } as never),
    );
    expect(html).toContain("Quên mật khẩu");
    expect(html).toContain('name="email"');
    // 30 minutes, not the 24 hours a verification link gets.
    expect(html).toContain("30 phút");
    expect(html).toContain("tối đa 3 liên kết mỗi giờ");
  });

  it("replaces the form after sending so the hourly allowance is not spent on retries", async () => {
    const sentHtml = renderToStaticMarkup(
      await ForgotPasswordPage({
        searchParams: Promise.resolve({ sent: "1" }),
      } as never),
    );
    expect(sentHtml).toContain("Đã gửi nếu email đã đăng ký");
    expect(sentHtml).not.toContain('name="email"');
    expect(sentHtml).toContain("đợi hết giờ rồi thử lại");
  });
});

describe("/dat-lai-mat-khau", () => {
  it("renders the reset form when the URL carries a token", async () => {
    const withToken = renderToStaticMarkup(
      await ResetPasswordPage({
        searchParams: Promise.resolve({ token: "abc123" }),
      } as never),
    );
    expect(withToken).toContain('name="password"');
    expect(withToken).toContain('value="abc123"');
    expect(withToken).not.toContain("Không đổi được mật khẩu");
  });

  it("offers a way to get a fresh link instead of stranding the holder of a dead one", async () => {
    const withoutToken = renderToStaticMarkup(
      await ResetPasswordPage({
        searchParams: Promise.resolve({}),
      } as never),
    );
    expect(withoutToken).not.toContain('name="password"');
    expect(withoutToken).toContain("Không đổi được mật khẩu");
    // The exit that used to be missing: sign-in alone is no help to someone
    // who cannot sign in.
    expect(withoutToken).toContain("/quen-mat-khau");
    expect(withoutToken).toContain("Xin liên kết mới");
  });

  it("keeps the form available when the action rejected a password, so it can be retried", async () => {
    const html = renderToStaticMarkup(
      await ResetPasswordPage({
        searchParams: Promise.resolve({ token: "abc123", error: "invalid" }),
      } as never),
    );
    expect(html).toContain("Không đổi được mật khẩu");
    expect(html).toContain('name="password"');
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

describe("/dang-nhap", () => {
  it("renders both sign-in paths and every recovery link", async () => {
    const html = renderToStaticMarkup(
      await SignInPage({ searchParams: Promise.resolve({}) } as never),
    );

    expect(html).toContain('name="email"');
    expect(html).toContain('name="password"');
    expect(html).toContain("Tiếp tục với Google");
    // Someone blocked by the deliberately vague error needs all three of these.
    expect(html).toContain("/dang-ky-tai-khoan");
    expect(html).toContain("/quen-mat-khau");
    expect(html).toContain("/xac-thuc-email");
  });

  it("redirects a signed-in visitor to the safe return path rather than rendering the form", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    await expect(
      SignInPage({
        searchParams: Promise.resolve({
          tiep: "/?cart=1&course=viet-bao-cao-khoa-hoc",
        }),
      } as never),
    ).rejects.toMatchObject({
      url: "/?cart=1&course=viet-bao-cao-khoa-hoc",
    });
  });

  it("refuses an off-site return path", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    await expect(
      SignInPage({
        searchParams: Promise.resolve({ tiep: "https://evil.example" }),
      } as never),
    ).rejects.toMatchObject({ url: "/tai-khoan" });
  });

  it("distinguishes the two good-news notices from the error", async () => {
    const verified = renderToStaticMarkup(
      await SignInPage({
        searchParams: Promise.resolve({ verified: "1" }),
      } as never),
    );
    expect(verified).toContain("Email đã được xác thực");
    expect(verified).toContain("text-success");

    const reset = renderToStaticMarkup(
      await SignInPage({ searchParams: Promise.resolve({ reset: "1" }) } as never),
    );
    expect(reset).toContain("Mật khẩu đã được đổi");
    expect(reset).toContain("text-success");

    const failed = renderToStaticMarkup(
      await SignInPage({
        searchParams: Promise.resolve({ error: "CredentialsSignin" }),
      } as never),
    );
    expect(failed).toContain("text-danger");
  });

  it("keeps the failure reason vague enough not to confirm an account exists", async () => {
    const html = renderToStaticMarkup(
      await SignInPage({
        searchParams: Promise.resolve({ error: "CredentialsSignin" }),
      } as never),
    );
    // One sentence covering wrong password, unverified, and rate-limited.
    expect(html).toContain("Email hoặc mật khẩu chưa đúng");
    expect(html).toContain("tài khoản chưa xác thực");
    expect(html).toContain("vượt giới hạn");
  });

  /**
   * `pages.error` trong lib/auth.ts đưa lỗi OAuth về đây, nên mã lỗi phải được
   * tra bảng. Trước đây trang in đúng một câu cho mọi giá trị, tức một lỗi cấu
   * hình sẽ hiện ra thành "sai mật khẩu".
   */
  it("tells an OAuth refusal apart from a wrong password", async () => {
    const denied = renderToStaticMarkup(
      await SignInPage({
        searchParams: Promise.resolve({ error: "AccessDenied" }),
      } as never),
    );
    expect(denied).toContain("Google không xác nhận địa chỉ email");
    expect(denied).not.toContain("Email hoặc mật khẩu chưa đúng");

    const misconfigured = renderToStaticMarkup(
      await SignInPage({
        searchParams: Promise.resolve({ error: "Configuration" }),
      } as never),
    );
    expect(misconfigured).toContain("lỗi cấu hình");
  });

  it("falls back to the pooled sentence for an error code it does not know", async () => {
    const html = renderToStaticMarkup(
      await SignInPage({
        searchParams: Promise.resolve({ error: "<script>alert(1)</script>" }),
      } as never),
    );
    expect(html).toContain("Email hoặc mật khẩu chưa đúng");
    expect(html).not.toContain("alert(1)");
  });

  /**
   * Tài khoản tạo bằng Google không có mật khẩu, nên gõ mật khẩu vào đó chỉ ra
   * câu lỗi gộp mãi mãi. Dòng gợi ý là cách duy nhất nói ra điều đó mà không
   * tiết lộ email nào có tài khoản.
   */
  it("points Google-only accounts at the button that works for them", async () => {
    const html = renderToStaticMarkup(
      await SignInPage({ searchParams: Promise.resolve({}) } as never),
    );
    expect(html).toContain("Tiếp tục với Google");
    expect(html).toContain("tài khoản đó chưa có mật khẩu");
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
    // Bấm nút này kích hoạt mật khẩu của lần đăng ký đã phát ra liên kết, và
    // lần đăng ký đó không nhất thiết là của chủ hộp thư.
    expect(html).toContain("Nếu bạn không tạo tài khoản này, đừng bấm");
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
