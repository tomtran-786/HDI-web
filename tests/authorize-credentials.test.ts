import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authorizeCredentials, type AuthorizeDeps } from "@/lib/authorize-credentials";

/**
 * Trước đây logic này là closure bên trong `NextAuth({...})` nên không bài test
 * nào chạm tới được — dù đây là đoạn quyết định ai vào được hệ thống.
 */
const PASSWORD = "correct horse battery staple";
let PASSWORD_HASH: string;

const verifiedUser = () => ({
  id: "user-1",
  email: "student@example.com",
  name: "Học viên",
  image: null,
  emailVerified: new Date(),
  passwordHash: PASSWORD_HASH,
});

function deps(overrides: Partial<AuthorizeDeps> = {}) {
  const log = { warn: vi.fn(), error: vi.fn() };
  return {
    deps: {
      findUser: vi.fn().mockResolvedValue(verifiedUser()),
      allowAttempt: vi.fn().mockResolvedValue(true),
      clearThrottle: vi.fn().mockResolvedValue(undefined),
      log,
      ...overrides,
    } as AuthorizeDeps,
    log,
  };
}

const credentials = (password = PASSWORD) => ({
  email: "student@example.com",
  password,
});

const request = () =>
  new Request("https://hdi.test/api/auth/callback/credentials", {
    headers: { "x-vercel-forwarded-for": "203.0.113.9" },
  });

function reasonOf(log: { warn: ReturnType<typeof vi.fn> }) {
  return log.warn.mock.calls.at(-1)?.[1]?.reason;
}

describe("authorizeCredentials", () => {
  beforeEach(async () => {
    PASSWORD_HASH ??= await bcrypt.hash(PASSWORD, 12);
  });

  it("returns the identity and never the password hash", async () => {
    const { deps: d } = deps();

    await expect(authorizeCredentials(credentials(), request(), d)).resolves.toEqual({
      id: "user-1",
      email: "student@example.com",
      name: "Học viên",
      image: null,
    });
  });

  it("hands the budget back once the password is known to be right", async () => {
    const { deps: d } = deps();

    await authorizeCredentials(credentials(), request(), d);
    expect(d.clearThrottle).toHaveBeenCalledWith("student@example.com", "203.0.113.9");
  });

  it("keeps the budget spent when the password is wrong", async () => {
    const { deps: d, log } = deps();

    await expect(
      authorizeCredentials(credentials("wrong password entirely"), request(), d),
    ).resolves.toBeNull();
    expect(d.clearThrottle).not.toHaveBeenCalled();
    expect(reasonOf(log)).toBe("bad_password");
  });

  /**
   * Người dùng chỉ thấy một câu gộp; lý do thật phải xuống log của máy chủ, kèm
   * email đã che. Thiếu đúng những dòng này mà một lần đăng nhập hỏng trên
   * production phải chẩn đoán bằng truy vấn tay vào database.
   */
  it.each([
    ["throttled", { allowAttempt: vi.fn().mockResolvedValue(false) }],
    ["no_user", { findUser: vi.fn().mockResolvedValue(null) }],
    [
      "unverified",
      { findUser: vi.fn().mockResolvedValue({ ...verifiedUser(), emailVerified: null }) },
    ],
    [
      "no_password",
      { findUser: vi.fn().mockResolvedValue({ ...verifiedUser(), passwordHash: null }) },
    ],
  ])("logs %s without telling the caller apart from any other refusal", async (
    reason,
    override,
  ) => {
    const { deps: d, log } = deps(override as Partial<AuthorizeDeps>);

    await expect(authorizeCredentials(credentials(), request(), d)).resolves.toBeNull();
    expect(reasonOf(log)).toBe(reason);
    expect(log.warn.mock.calls.at(-1)?.[1]?.email).toBe("stu•••@example.com");
  });

  it("does not spend an attempt on input that is not even shaped like a login", async () => {
    const { deps: d } = deps();

    await expect(
      authorizeCredentials({ email: "not-an-email", password: "" }, request(), d),
    ).resolves.toBeNull();
    expect(d.allowAttempt).not.toHaveBeenCalled();
  });

  /**
   * Database hỏng từng hiện ra thành "sai mật khẩu" và không để lại dòng log
   * nào, nên phía vận hành không phân biệt được "gõ sai" với "hệ thống chết".
   */
  it("reports a database failure as an error rather than a wrong password", async () => {
    const { deps: d, log } = deps({
      findUser: vi.fn().mockRejectedValue(new Error("connection terminated")),
    });

    await expect(authorizeCredentials(credentials(), request(), d)).resolves.toBeNull();
    expect(log.error).toHaveBeenCalled();
    expect(log.warn).not.toHaveBeenCalled();
  });
});
