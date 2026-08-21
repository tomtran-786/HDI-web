import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), userFindUnique: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    verificationToken: { findUnique: mocks.findUnique },
    user: { findUnique: mocks.userFindUnique },
  },
}));

import {
  authTokenIdentifier,
  consumeAuthToken,
  findVerifyRecipient,
  hashAuthToken,
  parseAuthTokenIdentifier,
} from "@/lib/auth-tokens";
import { maskEmail } from "@/lib/auth-input";

describe("authentication tokens", () => {
  it("stores a stable hash rather than the bearer token", () => {
    const raw = "secret-token-from-email";
    expect(hashAuthToken(raw)).toHaveLength(64);
    expect(hashAuthToken(raw)).not.toContain(raw);
    expect(hashAuthToken(raw)).toBe(hashAuthToken(raw));
  });

  it("keeps verification and reset purposes separate", () => {
    const identifier = authTokenIdentifier("verify", "user-1");
    expect(parseAuthTokenIdentifier(identifier, "verify")).toBe("user-1");
    expect(parseAuthTokenIdentifier(identifier, "reset")).toBeNull();
  });

  it("rejects an expired token before attempting to consume it", async () => {
    const token = "expired-token";
    const deleteMany = async () => {
      throw new Error("expired tokens must not be consumed");
    };
    const db = {
      verificationToken: {
        findUnique: async () => ({
          identifier: "verify:user-1",
          token: hashAuthToken(token),
          expires: new Date(Date.now() - 1),
        }),
        deleteMany,
      },
    };

    await expect(
      consumeAuthToken(db as never, "verify", token),
    ).resolves.toBeNull();
  });

  it("allows only the transaction that actually deletes a token to consume it", async () => {
    const token = "a".repeat(43);
    const record = {
      identifier: "reset:user-1",
      token: hashAuthToken(token),
      expires: new Date(Date.now() + 60_000),
    };
    const db = {
      verificationToken: {
        findUnique: async () => record,
        deleteMany: async () => ({ count: 0 }),
      },
    };

    await expect(
      consumeAuthToken(db as never, "reset", token),
    ).resolves.toBeNull();
  });

  it("invalidates sibling links after consuming the selected token", async () => {
    const token = "b".repeat(43);
    const deletes: unknown[] = [];
    const db = {
      verificationToken: {
        findUnique: async () => ({
          identifier: "verify:user-1",
          token: hashAuthToken(token),
          expires: new Date(Date.now() + 60_000),
        }),
        deleteMany: async (query: unknown) => {
          deletes.push(query);
          return { count: deletes.length === 1 ? 1 : 2 };
        },
      },
    };

    await expect(
      consumeAuthToken(db as never, "verify", token),
    ).resolves.toEqual({ userId: "user-1" });
    expect(deletes).toHaveLength(2);
  });
});

describe("maskEmail", () => {
  it("keeps enough of the local part to be recognisable and hides the rest", () => {
    expect(maskEmail("nguyenvana@gmail.com")).toBe("ngu•••@gmail.com");
    expect(maskEmail("ab@example.com")).toBe("a•••@example.com");
    expect(maskEmail("a@example.com")).toBe("a•••@example.com");
  });

  it("never returns anything address-shaped for malformed input", () => {
    expect(maskEmail("not-an-email")).toBe("•••");
    expect(maskEmail("@nolocal.com")).toBe("•••");
  });
});

describe("findVerifyRecipient", () => {
  beforeEach(() => {
    mocks.findUnique.mockReset();
    mocks.userFindUnique.mockReset();
  });

  const liveToken = () => ({
    identifier: "verify:user-1",
    token: hashAuthToken("live"),
    expires: new Date(Date.now() + 60_000),
  });

  it("returns a masked address for a token that is still live", async () => {
    mocks.findUnique.mockResolvedValue(liveToken());
    mocks.userFindUnique.mockResolvedValue({
      email: "nguyenvana@gmail.com",
      emailVerified: null,
    });

    await expect(findVerifyRecipient("live")).resolves.toEqual({
      maskedEmail: "ngu•••@gmail.com",
    });
  });

  it("treats an already-verified account as a dead link", async () => {
    mocks.findUnique.mockResolvedValue(liveToken());
    mocks.userFindUnique.mockResolvedValue({
      email: "nguyenvana@gmail.com",
      emailVerified: new Date(),
    });

    // The POST filters on emailVerified: null, so offering the button here
    // would only lead to a failure the page could have predicted.
    await expect(findVerifyRecipient("live")).resolves.toBeNull();
  });

  it("does not query at all for an empty token", async () => {
    await expect(findVerifyRecipient("")).resolves.toBeNull();
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("resolves without deleting anything, so a mail scanner cannot spend the link", async () => {
    mocks.findUnique.mockResolvedValue(liveToken());
    mocks.userFindUnique.mockResolvedValue({
      email: "x@y.com",
      emailVerified: null,
    });

    await findVerifyRecipient("live");
    // The mock exposes no deleteMany; reaching for one would throw.
    expect(mocks.findUnique).toHaveBeenCalledTimes(1);
  });
});
