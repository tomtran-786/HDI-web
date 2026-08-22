import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

class RedirectSignal extends Error {
  constructor(readonly url: string) {
    super(url);
  }
}

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
  allow: vi.fn(),
  ip: vi.fn(),
  findUnique: vi.fn(),
  userCreate: vi.fn(),
  transaction: vi.fn(),
  createToken: vi.fn(),
  sendVerification: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth-throttle", () => ({
  allowAuthEmail: mocks.allow,
  serverActionIp: mocks.ip,
}));
vi.mock("@/lib/auth-tokens", () => ({
  createAuthToken: mocks.createToken,
  VERIFY_TOKEN_TTL_MS: 24 * 60 * 60 * 1000,
}));

async function pendingHashFromLastToken() {
  const call = mocks.createToken.mock.calls.at(-1)?.[1];
  return call?.pendingPasswordHash as string;
}
vi.mock("@/lib/email", () => ({
  sendVerificationEmail: mocks.sendVerification,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mocks.findUnique },
    $transaction: mocks.transaction,
  },
}));

import { registerAccount } from "@/app/dang-ky-tai-khoan/actions";

function registrationForm(email = "student@example.com") {
  const form = new FormData();
  form.set("name", "Học viên");
  form.set("email", email);
  form.set("password", "correct horse battery staple");
  form.set("confirmPassword", "correct horse battery staple");
  return form;
}

describe("credential registration action", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.redirect.mockImplementation((url: string) => {
      throw new RedirectSignal(url);
    });
    mocks.allow.mockResolvedValue(true);
    mocks.ip.mockResolvedValue("127.0.0.1");
    mocks.transaction.mockImplementation(async (callback) =>
      callback({ user: { create: mocks.userCreate } }),
    );
    mocks.userCreate.mockResolvedValue({
      id: "user-1",
      email: "student@example.com",
      name: "Học viên",
    });
    mocks.createToken.mockResolvedValue({ token: "verify-token" });
    mocks.sendVerification.mockResolvedValue({ sent: true, id: "email-1" });
  });

  /**
   * Tài khoản chưa xác thực không được giữ mật khẩu: hash đi theo token, và chỉ
   * được áp lên tài khoản khi đúng liên kết đó được bấm.
   */
  it("puts the bcrypt cost-12 hash on the token, not on the new account", async () => {
    mocks.findUnique.mockResolvedValue(null);

    await expect(registerAccount(registrationForm())).rejects.toMatchObject({
      url: "/dang-ky-tai-khoan?sent=1",
    });
    const createInput = mocks.userCreate.mock.calls[0]?.[0];
    expect(createInput.data).not.toHaveProperty("passwordHash");

    const pending = await pendingHashFromLastToken();
    expect(pending).not.toBe("correct horse battery staple");
    expect(bcrypt.getRounds(pending)).toBe(12);
    await expect(
      bcrypt.compare("correct horse battery staple", pending),
    ).resolves.toBe(true);
    expect(mocks.createToken).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ purpose: "verify", ttlMs: 24 * 60 * 60 * 1000 }),
    );
    expect(mocks.sendVerification).toHaveBeenCalledWith({
      to: "student@example.com",
      name: "Học viên",
      token: "verify-token",
    });
  });

  it("refuses an email that already has a verified account", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "user-1",
      email: "student@example.com",
      name: "Học viên",
      emailVerified: new Date(),
    });

    await expect(registerAccount(registrationForm())).rejects.toMatchObject({
      url: "/dang-ky-tai-khoan?error=taken",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.sendVerification).not.toHaveBeenCalled();
  });

  /**
   * Nhánh từng gây lỗi thật: đăng ký lại một địa chỉ đang chờ xác thực chỉ gửi
   * lại thư và bỏ qua mật khẩu vừa nhập, nên sau khi xác thực người dùng đăng
   * nhập bằng mật khẩu đó không được. Giờ nó phát token mới mang đúng mật khẩu
   * vừa nhập, và token cũ bị `createAuthToken` xoá.
   */
  it("re-issues a link carrying the new password for an unverified account", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "user-1",
      email: "student@example.com",
      name: "Học viên",
      emailVerified: null,
    });

    await expect(registerAccount(registrationForm())).rejects.toMatchObject({
      url: "/dang-ky-tai-khoan?sent=1",
    });
    // Không tạo tài khoản thứ hai cho cùng địa chỉ.
    expect(mocks.transaction).not.toHaveBeenCalled();
    await expect(
      bcrypt.compare("correct horse battery staple", await pendingHashFromLastToken()),
    ).resolves.toBe(true);
    expect(mocks.sendVerification).toHaveBeenCalledWith(
      expect.objectContaining({ to: "student@example.com", token: "verify-token" }),
    );
  });

  it("reports a temporary failure when the account cannot be created", async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.transaction.mockRejectedValue(Object.assign(new Error("dup"), { code: "P2002" }));

    await expect(registerAccount(registrationForm())).rejects.toMatchObject({
      url: "/dang-ky-tai-khoan?error=failed",
    });
    expect(mocks.sendVerification).not.toHaveBeenCalled();
  });

  it("says so without a lookup when throttled", async () => {
    mocks.allow.mockResolvedValue(false);

    await expect(registerAccount(registrationForm())).rejects.toMatchObject({
      url: "/dang-ky-tai-khoan?error=throttled",
    });
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("carries the cart return path into the email and sent state", async () => {
    mocks.findUnique.mockResolvedValue(null);
    const form = registrationForm();
    form.set("tiep", "/?cart=1&course=viet-bao-cao-khoa-hoc");

    await expect(registerAccount(form)).rejects.toMatchObject({
      url:
        "/dang-ky-tai-khoan?sent=1&tiep=%2F%3Fcart%3D1%26course%3Dviet-bao-cao-khoa-hoc",
    });
    expect(mocks.sendVerification).toHaveBeenCalledWith(
      expect.objectContaining({
        next: "/?cart=1&course=viet-bao-cao-khoa-hoc",
      }),
    );
  });
});
