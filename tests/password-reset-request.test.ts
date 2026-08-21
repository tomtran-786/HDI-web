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
  createToken: vi.fn(),
  sendReset: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth-throttle", () => ({
  allowAuthEmail: mocks.allow,
  serverActionIp: mocks.ip,
}));
vi.mock("@/lib/auth-tokens", () => ({
  createAuthToken: mocks.createToken,
  RESET_TOKEN_TTL_MS: 30 * 60 * 1000,
}));
vi.mock("@/lib/email", () => ({ sendPasswordResetEmail: mocks.sendReset }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: mocks.findUnique } },
}));

import { requestPasswordReset } from "@/app/quen-mat-khau/actions";

function resetForm(email: string) {
  const form = new FormData();
  form.set("email", email);
  return form;
}

describe("password reset request", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.redirect.mockImplementation((url: string) => {
      throw new RedirectSignal(url);
    });
    mocks.allow.mockResolvedValue(true);
    mocks.ip.mockResolvedValue("127.0.0.1");
    mocks.createToken.mockResolvedValue({ token: "reset-token" });
    mocks.sendReset.mockResolvedValue({ sent: true, id: "email-1" });
  });

  it("uses the same response for unknown and verified emails", async () => {
    mocks.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: "user-1",
      name: "Học viên",
      email: "known@example.com",
      emailVerified: new Date(),
    });

    await expect(
      requestPasswordReset(resetForm("unknown@example.com")),
    ).rejects.toMatchObject({ url: "/quen-mat-khau?sent=1" });
    await expect(
      requestPasswordReset(resetForm("known@example.com")),
    ).rejects.toMatchObject({ url: "/quen-mat-khau?sent=1" });
    expect(mocks.sendReset).toHaveBeenCalledTimes(1);
    expect(mocks.createToken).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ purpose: "reset", ttlMs: 30 * 60 * 1000 }),
    );
  });

  it("does not look up an account when throttled", async () => {
    mocks.allow.mockResolvedValue(false);

    await expect(
      requestPasswordReset(resetForm("student@example.com")),
    ).rejects.toMatchObject({ url: "/quen-mat-khau?sent=1" });
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(mocks.sendReset).not.toHaveBeenCalled();
  });
});
