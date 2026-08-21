import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  deleteMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mocks.findUnique, update: mocks.update },
    verificationToken: { deleteMany: mocks.deleteMany },
    $transaction: mocks.transaction,
  },
}));

import {
  googleProfileHasVerifiedEmail,
  secureGoogleAccountLink,
} from "@/lib/auth-account-link";

describe("Google account linking policy", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.update.mockReturnValue(Promise.resolve({ id: "user-1" }));
    mocks.deleteMany.mockReturnValue(Promise.resolve({ count: 1 }));
    mocks.transaction.mockResolvedValue([]);
  });

  it("accepts only a Google-verified email profile", () => {
    expect(
      googleProfileHasVerifiedEmail({
        email: "student@example.com",
        email_verified: true,
      }),
    ).toBe(true);
    expect(
      googleProfileHasVerifiedEmail({
        email: "student@example.com",
        email_verified: false,
      }),
    ).toBe(false);
    expect(googleProfileHasVerifiedEmail({ email_verified: true })).toBe(false);
  });

  it("clears an unverified pre-registered password and verification links", async () => {
    mocks.findUnique.mockResolvedValue({ emailVerified: null });

    await expect(secureGoogleAccountLink("user-1")).resolves.toEqual({
      secured: true,
    });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { emailVerified: expect.any(Date), passwordHash: null },
    });
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: { identifier: "verify:user-1" },
    });
    expect(mocks.transaction).toHaveBeenCalledOnce();
  });

  it("keeps an already verified credential account unchanged", async () => {
    mocks.findUnique.mockResolvedValue({ emailVerified: new Date() });

    await expect(secureGoogleAccountLink("user-1")).resolves.toEqual({
      secured: false,
    });
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.deleteMany).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
