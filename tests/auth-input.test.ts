import { describe, expect, it } from "vitest";
import {
  credentialsSchema,
  normalizeEmail,
  registrationSchema,
} from "@/lib/auth-input";

describe("credential validation", () => {
  it("normalizes email without changing the password", () => {
    const parsed = credentialsSchema.parse({
      email: "  Student@Example.COM ",
      password: "  keep spaces  ",
    });
    expect(parsed).toEqual({
      email: "student@example.com",
      password: "  keep spaces  ",
    });
    expect(normalizeEmail(" A@B.COM ")).toBe("a@b.com");
  });

  it("requires a matching password of at least 12 characters", () => {
    expect(
      registrationSchema.safeParse({
        name: "Học viên",
        email: "student@example.com",
        password: "short",
        confirmPassword: "short",
      }).success,
    ).toBe(false);
    expect(
      registrationSchema.safeParse({
        name: "Học viên",
        email: "student@example.com",
        password: "correct horse battery staple",
        confirmPassword: "different password",
      }).success,
    ).toBe(false);
  });

  it("rejects bcrypt inputs longer than 72 UTF-8 bytes", () => {
    const longUnicode = "ộ".repeat(37);
    expect(
      registrationSchema.safeParse({
        name: "Học viên",
        email: "student@example.com",
        password: longUnicode,
        confirmPassword: longUnicode,
      }).success,
    ).toBe(false);
  });
});

