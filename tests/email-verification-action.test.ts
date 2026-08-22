import { beforeEach, describe, expect, it, vi } from "vitest";

class RedirectSignal extends Error {
  constructor(readonly url: string) {
    super(url);
  }
}

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
  transaction: vi.fn(),
  consumeToken: vi.fn(),
  updateMany: vi.fn(),
  allowVerifyConsume: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth-tokens", () => ({
  consumeAuthToken: mocks.consumeToken,
  authTokenIdentifier: vi.fn(),
  createAuthToken: vi.fn(),
  pendingPasswordHashFor: vi.fn(),
  VERIFY_TOKEN_TTL_MS: 24 * 60 * 60 * 1000,
}));
vi.mock("@/lib/auth-throttle", () => ({
  allowAuthEmail: vi.fn(),
  allowVerifyConsume: mocks.allowVerifyConsume,
  serverActionIp: vi.fn(),
}));
vi.mock("@/lib/email", () => ({ sendVerificationEmail: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    user: { findUnique: vi.fn() },
    verificationToken: { deleteMany: vi.fn() },
  },
}));

import { verifyEmail } from "@/app/xac-thuc-email/actions";

function verificationForm(token = "verification-token") {
  const form = new FormData();
  form.set("token", token);
  return form;
}

describe("email verification action", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.redirect.mockImplementation((url: string) => {
      throw new RedirectSignal(url);
    });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({ user: { updateMany: mocks.updateMany } }),
    );
    mocks.consumeToken.mockResolvedValue({
      userId: "user-1",
      pendingPasswordHash: null,
    });
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.allowVerifyConsume.mockResolvedValue(true);
  });

  it("consumes and verifies the account in one transaction", async () => {
    await expect(verifyEmail(verificationForm())).rejects.toMatchObject({
      url: "/dang-nhap?verified=1",
    });

    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.consumeToken).toHaveBeenCalledWith(
      expect.objectContaining({ user: expect.anything() }),
      "verify",
      "verification-token",
    );
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "user-1", emailVerified: null },
      data: { emailVerified: expect.any(Date) },
    });
  });

  /**
   * Nếu mật khẩu nằm trên tài khoản thay vì trên token, người đăng ký chèn một
   * địa chỉ trước sẽ đặt được mật khẩu cho tài khoản mà chính chủ hộp thư kích
   * hoạt hộ. Chỉ hash đi cùng liên kết vừa bấm mới được ghi.
   */
  it("applies the password that came with the consumed link", async () => {
    mocks.consumeToken.mockResolvedValue({
      userId: "user-1",
      pendingPasswordHash: "$2b$12$hash-from-this-registration",
    });

    await expect(verifyEmail(verificationForm())).rejects.toMatchObject({
      url: "/dang-nhap?verified=1",
    });
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "user-1", emailVerified: null },
      data: {
        emailVerified: expect.any(Date),
        passwordHash: "$2b$12$hash-from-this-registration",
      },
    });
  });

  it("refuses to consume once the per-IP limit is spent", async () => {
    mocks.allowVerifyConsume.mockResolvedValue(false);

    await expect(verifyEmail(verificationForm())).rejects.toMatchObject({
      url: "/xac-thuc-email?error=invalid",
    });
    expect(mocks.consumeToken).not.toHaveBeenCalled();
  });

  it("rejects an expired or replayed token without updating the user", async () => {
    mocks.consumeToken.mockResolvedValue(null);

    await expect(verifyEmail(verificationForm("replayed"))).rejects.toMatchObject({
      url: "/xac-thuc-email?error=invalid",
    });
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("preserves the cart return after a successful verification", async () => {
    const form = verificationForm();
    form.set("tiep", "/?cart=1&course=viet-bao-cao-khoa-hoc");
    await expect(verifyEmail(form)).rejects.toMatchObject({
      url:
        "/dang-nhap?verified=1&tiep=%2F%3Fcart%3D1%26course%3Dviet-bao-cao-khoa-hoc",
    });
  });
});
