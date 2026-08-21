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

  it("stores a bcrypt cost-12 hash and sends a 24-hour verification link", async () => {
    mocks.findUnique.mockResolvedValue(null);

    await expect(registerAccount(registrationForm())).rejects.toMatchObject({
      url: "/dang-ky-tai-khoan?sent=1",
    });
    const createInput = mocks.userCreate.mock.calls[0]?.[0];
    expect(createInput.data.passwordHash).not.toBe("correct horse battery staple");
    expect(bcrypt.getRounds(createInput.data.passwordHash)).toBe(12);
    await expect(
      bcrypt.compare("correct horse battery staple", createInput.data.passwordHash),
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

  it("returns the same generic response for an already verified email", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "user-1",
      email: "student@example.com",
      name: "Học viên",
      emailVerified: new Date(),
    });

    await expect(registerAccount(registrationForm())).rejects.toMatchObject({
      url: "/dang-ky-tai-khoan?sent=1",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.sendVerification).not.toHaveBeenCalled();
  });

  it("returns the generic response without a lookup when throttled", async () => {
    mocks.allow.mockResolvedValue(false);

    await expect(registerAccount(registrationForm())).rejects.toMatchObject({
      url: "/dang-ky-tai-khoan?sent=1",
    });
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
});
