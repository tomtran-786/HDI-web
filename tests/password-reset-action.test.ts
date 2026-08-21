import bcrypt from "bcryptjs";
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
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth-tokens", () => ({ consumeAuthToken: mocks.consumeToken }));
vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: mocks.transaction },
}));

import { resetPassword } from "@/app/dat-lai-mat-khau/actions";

function resetForm(token = "r".repeat(43)) {
  const form = new FormData();
  form.set("token", token);
  form.set("password", "correct horse battery staple");
  form.set("confirmPassword", "correct horse battery staple");
  return form;
}

describe("password reset action", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.redirect.mockImplementation((url: string) => {
      throw new RedirectSignal(url);
    });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({ user: { updateMany: mocks.updateMany } }),
    );
    mocks.consumeToken.mockResolvedValue({ userId: "user-1" });
    mocks.updateMany.mockResolvedValue({ count: 1 });
  });

  it("sets a cost-12 password and advances the session cutoff transactionally", async () => {
    await expect(resetPassword(resetForm())).rejects.toMatchObject({
      url: "/dang-nhap?reset=1",
    });

    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.consumeToken).toHaveBeenCalledWith(
      expect.objectContaining({ user: expect.anything() }),
      "reset",
      "r".repeat(43),
    );
    const update = mocks.updateMany.mock.calls[0]?.[0];
    expect(update.where).toEqual({
      id: "user-1",
      emailVerified: { not: null },
    });
    expect(update.data.sessionsValidAfter).toBeInstanceOf(Date);
    expect(bcrypt.getRounds(update.data.passwordHash)).toBe(12);
    await expect(
      bcrypt.compare("correct horse battery staple", update.data.passwordHash),
    ).resolves.toBe(true);
  });

  it("rejects an expired or replayed token without changing the password", async () => {
    mocks.consumeToken.mockResolvedValue(null);

    await expect(resetPassword(resetForm("x".repeat(43)))).rejects.toMatchObject({
      url: "/dat-lai-mat-khau?error=invalid",
    });
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("does not establish a password on an unverified account", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });

    await expect(resetPassword(resetForm())).rejects.toMatchObject({
      url: "/dat-lai-mat-khau?error=invalid",
    });
  });
});
