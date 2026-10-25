import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  currentProfile: vi.fn(),
  isProfileComplete: vi.fn(),
  allowUserAction: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/current-profile", () => ({ currentProfile: mocks.currentProfile }));
vi.mock("@/lib/profile", () => ({ isProfileComplete: mocks.isProfileComplete }));
vi.mock("@/lib/auth-throttle", () => ({ allowUserAction: mocks.allowUserAction }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: mocks.findUnique } },
}));

import { POST } from "@/app/api/gio-hang/ma-gioi-thieu/route";
import { referralPanel } from "@/content/checkout";
import { referralFailureMessage } from "@/lib/referral-resolve";

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/gio-hang/ma-gioi-thieu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

describe("POST /api/gio-hang/ma-gioi-thieu", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.auth.mockResolvedValue({ user: { id: "buyer" } });
    mocks.currentProfile.mockResolvedValue({ id: "buyer" });
    mocks.isProfileComplete.mockReturnValue(true);
    mocks.allowUserAction.mockResolvedValue(true);
    mocks.findUnique.mockResolvedValue({ id: "referrer" });
  });

  it("yêu cầu đăng nhập trước khi tra bất cứ mã nào", async () => {
    mocks.auth.mockResolvedValue(null);
    const response = await post({ code: "SKGAXBZR" });

    expect(response.status).toBe(401);
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(mocks.allowUserAction).not.toHaveBeenCalled();
  });

  it("401 khi không có hồ sơ, 409 khi hồ sơ chưa đủ", async () => {
    mocks.currentProfile.mockResolvedValue(null);
    expect((await post({ code: "SKGAXBZR" })).status).toBe(401);

    mocks.currentProfile.mockResolvedValue({ id: "buyer" });
    mocks.isProfileComplete.mockReturnValue(false);
    const response = await post({ code: "SKGAXBZR" });
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "profile_required" });
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("body không phải JSON thì 400", async () => {
    const response = await post("{không phải json");
    expect(response.status).toBe(400);
  });

  it("mã hợp lệ → ok, và tra bằng mã đã chuẩn hóa (hoa, bỏ khoảng trắng)", async () => {
    const response = await post({ code: "  skgaxbzr " });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mocks.findUnique).toHaveBeenCalledWith({
      where: { referralCode: "SKGAXBZR" },
      select: { id: true },
    });
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });

  it("mã không tồn tại → reason unknown", async () => {
    mocks.findUnique.mockResolvedValue(null);
    const response = await post({ code: "KHONGCO" });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: false, reason: "unknown" });
  });

  it("mã của chính mình → reason self", async () => {
    mocks.findUnique.mockResolvedValue({ id: "buyer" });
    const response = await post({ code: "SKGAXBZR" });

    await expect(response.json()).resolves.toEqual({ ok: false, reason: "self" });
  });

  it("ô trống hoặc sai kiểu không tra database và không tiêu hạn mức", async () => {
    for (const body of [{ code: "" }, { code: "   " }, { code: 123 }, {}, null]) {
      const response = await post(body);
      await expect(response.json()).resolves.toEqual({ ok: false, reason: "unknown" });
    }
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(mocks.allowUserAction).not.toHaveBeenCalled();
  });

  it("hết hạn mức → 429 reason throttled, không tra database", async () => {
    mocks.allowUserAction.mockResolvedValue(false);
    const response = await post({ code: "SKGAXBZR" });

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({ ok: false, reason: "throttled" });
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("dùng chung khóa hạn mức referral_code với server action checkout", async () => {
    await post({ code: "SKGAXBZR" });

    expect(mocks.allowUserAction).toHaveBeenCalledWith("referral_code", "buyer", 30);
  });
});

describe("referralFailureMessage", () => {
  it("map đúng ba lý do sang ba câu báo lỗi", () => {
    expect(referralFailureMessage("unknown")).toBe(referralPanel.codeUnknownError);
    expect(referralFailureMessage("self")).toBe(referralPanel.codeSelfError);
    expect(referralFailureMessage("throttled")).toBe(referralPanel.codeThrottledError);
  });
});
