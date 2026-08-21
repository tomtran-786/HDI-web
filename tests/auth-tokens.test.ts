import { describe, expect, it } from "vitest";
import {
  authTokenIdentifier,
  consumeAuthToken,
  hashAuthToken,
  parseAuthTokenIdentifier,
} from "@/lib/auth-tokens";

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
