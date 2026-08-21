import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { verifiedCredentialIdentity } from "@/lib/credential-password";

const base = {
  id: "user-1",
  email: "student@example.com",
  name: "Học viên",
  image: null,
};

describe("credential password authorization", () => {
  it("accepts a verified user with the correct bcrypt password", async () => {
    const password = "correct horse battery staple";
    const passwordHash = await bcrypt.hash(password, 4);
    await expect(
      verifiedCredentialIdentity(
        { ...base, emailVerified: new Date(), passwordHash },
        password,
      ),
    ).resolves.toEqual(base);
  });

  it("rejects unverified, passwordless and wrong-password accounts", async () => {
    const passwordHash = await bcrypt.hash("correct password", 4);
    await expect(
      verifiedCredentialIdentity(
        { ...base, emailVerified: null, passwordHash },
        "correct password",
      ),
    ).resolves.toBeNull();
    await expect(
      verifiedCredentialIdentity(
        { ...base, emailVerified: new Date(), passwordHash: null },
        "correct password",
      ),
    ).resolves.toBeNull();
    await expect(
      verifiedCredentialIdentity(
        { ...base, emailVerified: new Date(), passwordHash },
        "wrong password",
      ),
    ).resolves.toBeNull();
  });
});
