import { beforeEach, describe, expect, it, vi } from "vitest";

class RedirectSignal extends Error {
  constructor(readonly url: string) {
    super(url);
  }
}

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  redirect: vi.fn(),
  currentProfile: vi.fn(),
  allowUserAction: vi.fn(),
  createServiceOrder: vi.fn(),
  ensureServiceCheckout: vi.fn(),
  markCheckoutHandoff: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/current-profile", () => ({ currentProfile: mocks.currentProfile }));
vi.mock("@/lib/auth-throttle", () => ({ allowUserAction: mocks.allowUserAction }));
vi.mock("@/lib/service-orders", () => ({
  createServiceOrder: mocks.createServiceOrder,
  ensureServiceCheckout: mocks.ensureServiceCheckout,
  cancelServiceOrder: vi.fn(),
}));
vi.mock("@/lib/checkout-handoff", () => ({
  markCheckoutHandoff: mocks.markCheckoutHandoff,
}));

import { startServiceCheckout } from "@/app/kiem-tra-ai-dao-van/actions";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("đặt dịch vụ check AI", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.redirect.mockImplementation((url: string) => {
      throw new RedirectSignal(url);
    });
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.currentProfile.mockResolvedValue({
      phone: "0901234567",
      stage: "journal_article",
    });
    mocks.allowUserAction.mockResolvedValue(true);
    mocks.createServiceOrder.mockResolvedValue({
      ok: true,
      ref: "a".repeat(32),
      code: 900_000_001,
      amountVnd: 70_000,
    });
    mocks.ensureServiceCheckout.mockResolvedValue({
      ok: true,
      checkoutUrl: "https://payos.test/checkout",
    });
  });

  it("đưa người chưa đăng nhập sang trang đăng nhập, không tạo đơn nào", async () => {
    mocks.auth.mockResolvedValue(null);
    await expect(
      startServiceCheckout({}, form({ wordCount: "8000", kind: "combo" })),
    ).rejects.toMatchObject({
      url: "/dang-nhap?tiep=%2Fkiem-tra-ai-dao-van%3FsoTu%3D8000%26dichVu%3Dcombo",
    });
    expect(mocks.createServiceOrder).not.toHaveBeenCalled();
    expect(mocks.allowUserAction).not.toHaveBeenCalled();
  });

  it("đưa hồ sơ chưa đủ sang trang hoàn tất và giữ nguyên báo giá", async () => {
    mocks.currentProfile.mockResolvedValue({ phone: null, stage: null });
    await expect(
      startServiceCheckout({}, form({ wordCount: "8000", kind: "combo" })),
    ).rejects.toMatchObject({
      url: "/hoan-tat-ho-so?tiep=%2Fkiem-tra-ai-dao-van%3FsoTu%3D8000%26dichVu%3Dcombo",
    });
    expect(mocks.createServiceOrder).not.toHaveBeenCalled();
    expect(mocks.ensureServiceCheckout).not.toHaveBeenCalled();
  });

  it("gắn đơn với tài khoản đang đăng nhập và bỏ qua số tiền client gửi lên", async () => {
    const forged = form({ wordCount: "8000", kind: "combo" });
    // Một Server Action là endpoint POST riêng: client thêm trường được.
    forged.set("amountVnd", "1");
    forged.set("userId", "nguoi-khac");

    await expect(startServiceCheckout({}, forged)).rejects.toMatchObject({
      url: "https://payos.test/checkout",
    });
    expect(mocks.createServiceOrder).toHaveBeenCalledWith({
      userId: "user-1",
      kind: "combo",
      wordCount: 8000,
    });
    expect(mocks.ensureServiceCheckout).toHaveBeenCalledWith(
      "a".repeat(32),
      "user-1",
    );
  });

  it("chặn khi vượt hạn mức trước khi gọi sang PayOS", async () => {
    mocks.allowUserAction.mockResolvedValue(false);
    const result = await startServiceCheckout(
      {},
      form({ wordCount: "8000", kind: "combo" }),
    );
    expect(result.error).toContain("quá nhiều đơn");
    expect(mocks.createServiceOrder).not.toHaveBeenCalled();
  });

  it("trả lại lỗi báo giá thay vì tạo đơn khi số từ vượt bảng", async () => {
    mocks.createServiceOrder.mockResolvedValue({
      ok: false,
      reason: "too_long",
      message: "Bản thảo dài hơn bảng giá.",
    });
    const result = await startServiceCheckout(
      {},
      form({ wordCount: "40000", kind: "combo" }),
    );
    expect(result).toEqual({ error: "Bản thảo dài hơn bảng giá." });
    expect(mocks.ensureServiceCheckout).not.toHaveBeenCalled();
  });

  it("đưa về trang kết quả khi PayOS nhận đơn nhưng chưa trả link", async () => {
    mocks.ensureServiceCheckout.mockResolvedValue({
      ok: false,
      state: "pending_gateway",
      message: "PayOS chưa trả lại đường dẫn.",
    });
    await expect(
      startServiceCheckout({}, form({ wordCount: "8000", kind: "combo" })),
    ).rejects.toMatchObject({
      url: `/kiem-tra-ai-dao-van/ket-qua/${"a".repeat(32)}`,
    });
  });
});
