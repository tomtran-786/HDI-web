import { beforeEach, describe, expect, it, vi } from "vitest";

class RedirectSignal extends Error {
  constructor(readonly url: string) {
    super(url);
  }
}

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
  allowAuthEmail: vi.fn(),
  allowVerifyConsume: vi.fn(),
  ip: vi.fn(),
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  userUpdateMany: vi.fn(),
  transaction: vi.fn(),
  createToken: vi.fn(),
  consumeToken: vi.fn(),
  pendingPasswordHashFor: vi.fn(),
  pendingReferrerFor: vi.fn(),
  sendVerification: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth-throttle", () => ({
  allowAuthEmail: mocks.allowAuthEmail,
  allowVerifyConsume: mocks.allowVerifyConsume,
  serverActionIp: mocks.ip,
}));
vi.mock("@/lib/auth-tokens", () => ({
  createAuthToken: mocks.createToken,
  consumeAuthToken: mocks.consumeToken,
  authTokenIdentifier: vi.fn(),
  pendingPasswordHashFor: mocks.pendingPasswordHashFor,
  pendingReferrerFor: mocks.pendingReferrerFor,
  VERIFY_TOKEN_TTL_MS: 24 * 60 * 60 * 1000,
}));
vi.mock("@/lib/email", () => ({ sendVerificationEmail: mocks.sendVerification }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mocks.userFindUnique },
    verificationToken: { deleteMany: vi.fn() },
    $transaction: mocks.transaction,
  },
}));

import { registerAccount } from "@/app/dang-ky-tai-khoan/actions";
import { resendVerification, verifyEmail } from "@/app/xac-thuc-email/actions";

const REFERRER_ID = "user-referrer";

function registrationForm(referralCode?: string) {
  const form = new FormData();
  form.set("name", "Học viên");
  form.set("email", "student@example.com");
  form.set("password", "correct horse battery staple");
  form.set("confirmPassword", "correct horse battery staple");
  if (referralCode !== undefined) form.set("maGioiThieu", referralCode);
  return form;
}

/** Một `findUnique` phục vụ hai truy vấn khác nhau; phân biệt bằng `where`. */
function userLookups(options: { referrerExists: boolean }) {
  return async (args: { where: Record<string, unknown> }) => {
    if ("referralCode" in args.where) {
      return options.referrerExists ? { id: REFERRER_ID } : null;
    }
    return null; // email chưa có tài khoản nào
  };
}

function lastTokenInput() {
  return mocks.createToken.mock.calls.at(-1)?.[1] as {
    pendingReferrerId?: string | null;
  };
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.redirect.mockImplementation((url: string) => {
    throw new RedirectSignal(url);
  });
  mocks.allowAuthEmail.mockResolvedValue(true);
  mocks.allowVerifyConsume.mockResolvedValue(true);
  mocks.ip.mockResolvedValue("127.0.0.1");
  mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
    callback({
      user: { create: mocks.userCreate, updateMany: mocks.userUpdateMany },
    }),
  );
  mocks.userCreate.mockResolvedValue({
    id: "user-new",
    email: "student@example.com",
    name: "Học viên",
  });
  mocks.userUpdateMany.mockResolvedValue({ count: 1 });
  mocks.createToken.mockResolvedValue({ token: "verify-token" });
  mocks.consumeToken.mockResolvedValue({
    userId: "user-new",
    pendingPasswordHash: null,
    pendingReferrerId: null,
  });
  mocks.sendVerification.mockResolvedValue({ sent: true, id: "email-1" });
});

describe("khai mã giới thiệu lúc đăng ký", () => {
  it("gắn người giới thiệu lên token chứ không lên tài khoản", async () => {
    mocks.userFindUnique.mockImplementation(userLookups({ referrerExists: true }));

    await expect(registerAccount(registrationForm("abc23xyz"))).rejects.toMatchObject({
      url: "/dang-ky-tai-khoan?sent=1",
    });

    // Tra mã đã được chuẩn hóa trước khi xuống database.
    expect(mocks.userFindUnique).toHaveBeenCalledWith({
      where: { referralCode: "ABC23XYZ" },
      select: { id: true },
    });
    expect(lastTokenInput().pendingReferrerId).toBe(REFERRER_ID);
    // Hàng User không mang quan hệ này — nó chỉ được ghi lúc xác thực.
    expect(mocks.userCreate.mock.calls[0]?.[0].data).not.toHaveProperty(
      "referredById",
    );
  });

  /**
   * Bỏ qua im lặng là cách chắc chắn nhất để cả hai bên cùng mất phần mà không
   * ai biết: quan hệ giới thiệu chỉ gắn được một lần và không sửa lại được.
   */
  it("từ chối rõ ràng khi mã không tồn tại, và không tạo tài khoản", async () => {
    mocks.userFindUnique.mockImplementation(userLookups({ referrerExists: false }));

    await expect(registerAccount(registrationForm("KHONGCO1"))).rejects.toMatchObject({
      url: "/dang-ky-tai-khoan?error=ma_gioi_thieu",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.createToken).not.toHaveBeenCalled();
    expect(mocks.sendVerification).not.toHaveBeenCalled();
  });

  it("đăng ký không kèm mã vẫn chạy như cũ và không tra gì thêm", async () => {
    mocks.userFindUnique.mockImplementation(userLookups({ referrerExists: true }));

    await expect(registerAccount(registrationForm())).rejects.toMatchObject({
      url: "/dang-ky-tai-khoan?sent=1",
    });
    expect(lastTokenInput().pendingReferrerId).toBeNull();
    for (const call of mocks.userFindUnique.mock.calls) {
      expect(call[0].where).not.toHaveProperty("referralCode");
    }
  });

  it("coi ô mã để trống là không khai mã", async () => {
    mocks.userFindUnique.mockImplementation(userLookups({ referrerExists: true }));

    await expect(registerAccount(registrationForm("   "))).rejects.toMatchObject({
      url: "/dang-ky-tai-khoan?sent=1",
    });
    expect(lastTokenInput().pendingReferrerId).toBeNull();
  });

  /**
   * Đăng ký lại một địa chỉ CHƯA xác thực là hợp lệ và khi đó hàng User không bị
   * đụng tới — chỉ token mới được phát. Đây chính là lý do mã phải đi theo token:
   * ghi thẳng lúc `user.create` thì lần đăng ký lại với mã khác bị bỏ qua im lặng.
   */
  it("lần đăng ký lại mang mã mới, dù hàng User không đổi", async () => {
    mocks.userFindUnique.mockImplementation(
      async (args: { where: Record<string, unknown> }) => {
        if ("referralCode" in args.where) return { id: REFERRER_ID };
        return {
          id: "user-new",
          email: "student@example.com",
          name: "Học viên",
          emailVerified: null,
        };
      },
    );

    await expect(registerAccount(registrationForm("ABC23XYZ"))).rejects.toMatchObject({
      url: "/dang-ky-tai-khoan?sent=1",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(lastTokenInput().pendingReferrerId).toBe(REFERRER_ID);
  });
});

describe("gắn quan hệ lúc xác thực email", () => {
  it("ghi referredById trong cùng transaction kích hoạt tài khoản", async () => {
    mocks.consumeToken.mockResolvedValue({
      userId: "user-new",
      pendingPasswordHash: null,
      pendingReferrerId: REFERRER_ID,
    });

    await expect(verifyEmail(verificationForm())).rejects.toMatchObject({
      url: "/dang-nhap?verified=1",
    });

    const call = mocks.userUpdateMany.mock.calls[0][0];
    expect(call.data.referredById).toBe(REFERRER_ID);
    // Bộ lọc này là cái khóa khiến quan hệ chỉ ghi được đúng một lần trong đời
    // một tài khoản.
    expect(call.where).toEqual({ id: "user-new", emailVerified: null });
  });

  it("không đụng tới referredById khi token không mang mã", async () => {
    await expect(verifyEmail(verificationForm())).rejects.toMatchObject({
      url: "/dang-nhap?verified=1",
    });
    expect(mocks.userUpdateMany.mock.calls[0][0].data).not.toHaveProperty(
      "referredById",
    );
  });

  /**
   * `createAuthToken` xoá token cũ trước khi tạo token mới. Không đọc trước thì
   * một lượt "gửi lại liên kết" làm rơi mã, và quan hệ mất vĩnh viễn vì nó chỉ
   * gắn được một lần.
   */
  it("chở mã sang token mới khi gửi lại liên kết", async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: "user-new",
      name: "Học viên",
      email: "student@example.com",
      emailVerified: null,
    });
    mocks.pendingPasswordHashFor.mockResolvedValue("$2b$12$hash");
    mocks.pendingReferrerFor.mockResolvedValue(REFERRER_ID);

    const form = new FormData();
    form.set("email", "student@example.com");
    await expect(resendVerification(form)).rejects.toMatchObject({
      url: "/xac-thuc-email?sent=1",
    });

    expect(mocks.createToken).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        pendingPasswordHash: "$2b$12$hash",
        pendingReferrerId: REFERRER_ID,
      }),
    );
  });
});

function verificationForm(token = "verify-token") {
  const form = new FormData();
  form.set("token", token);
  return form;
}
