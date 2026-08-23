import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  findFirst: vi.fn(),
  updateMany: vi.fn(),
  payosCreate: vi.fn(),
  payosGet: vi.fn(),
  isPayosNotFound: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    serviceOrder: {
      create: mocks.create,
      findFirst: mocks.findFirst,
      updateMany: mocks.updateMany,
    },
  },
}));
vi.mock("@/lib/payos", () => ({
  payosClient: () => ({
    paymentRequests: { create: mocks.payosCreate, get: mocks.payosGet },
  }),
  isPayosNotFound: mocks.isPayosNotFound,
}));

import { createServiceOrder, ensureServiceCheckout } from "@/lib/service-orders";

const USER = "user-1";

describe("đơn dịch vụ check AI", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.isPayosNotFound.mockReturnValue(false);
    mocks.create.mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
      ref: data.ref,
      code: 900_000_001,
      amountVnd: data.amountVnd,
    }));
    mocks.updateMany.mockResolvedValue({ count: 1 });
  });

  it("tự tra giá từ bảng và bỏ qua mọi số tiền client gửi lên", async () => {
    const result = await createServiceOrder({
      userId: USER,
      kind: "combo",
      wordCount: 15_000,
      // Một Server Action là endpoint POST riêng: client gửi thêm trường được.
      ...({ amountVnd: 1 } as object),
    });

    expect(result).toMatchObject({ ok: true, amountVnd: 70_000 });
    const written = mocks.create.mock.calls[0][0].data;
    expect(written).toMatchObject({
      // Chủ đơn đến từ phiên đăng nhập phía server, không từ form.
      userId: USER,
      kind: "combo",
      wordCount: 15_000,
      tier: "tren-40-trang",
      amountVnd: 70_000,
      provider: "payos",
    });
    // `ref` đi vào URL công khai nên nó phải là byte ngẫu nhiên, không phải mã đơn.
    expect(written.ref).toMatch(/^[0-9a-f]{32}$/);
  });

  it("đặt hạn 24 giờ — dài hơn đơn khóa học vì nó không giữ chỗ của ai", async () => {
    const before = Date.now();
    await createServiceOrder({ userId: USER, kind: "ai", wordCount: 5_000 });
    const expiresAt = mocks.create.mock.calls[0][0].data.expiresAt as Date;
    const hours = (expiresAt.getTime() - before) / 3_600_000;
    expect(hours).toBeGreaterThan(23.9);
    expect(hours).toBeLessThan(24.1);
  });

  it("từ chối bài dài hơn bảng giá thay vì đoán một con số", async () => {
    const result = await createServiceOrder({ userId: USER, kind: "combo", wordCount: 40_000 });
    expect(result).toMatchObject({ ok: false, reason: "too_long" });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("từ chối số từ và loại dịch vụ không hợp lệ", async () => {
    expect(await createServiceOrder({ userId: USER, kind: "combo", wordCount: 0 })).toMatchObject({
      reason: "invalid_words",
    });
    expect(
      await createServiceOrder({ userId: USER, kind: "humanize", wordCount: 5_000 }),
    ).toMatchObject({ reason: "invalid_kind" });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("trả lại link đã có thay vì tạo link PayOS thứ hai cho cùng một đơn", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "svc-1",
      code: 900_000_001,
      status: "pending",
      amountVnd: 50_000,
      expiresAt: new Date(Date.now() + 3_600_000),
      checkoutUrl: "https://payos.test/da-co",
      kind: "combo",
      user: { name: "Học viên", email: "hv@test.vn", phone: "0900000000" },
    });

    const result = await ensureServiceCheckout("a".repeat(32), USER);
    expect(result).toEqual({ ok: true, checkoutUrl: "https://payos.test/da-co" });
    expect(mocks.payosCreate).not.toHaveBeenCalled();
    // Chủ đơn nằm TRONG `where`, không phải kiểm sau khi đọc: ref của người
    // khác không được tạo ra link thanh toán dù người gọi đã đăng nhập.
    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ref: "a".repeat(32), userId: USER },
      }),
    );
  });

  it("gửi sang PayOS đúng số tiền đã lưu, và mô tả phân biệt được với đơn khóa học", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "svc-1",
      code: 900_000_123,
      status: "pending",
      amountVnd: 70_000,
      expiresAt: new Date(Date.now() + 3_600_000),
      checkoutUrl: null,
      kind: "combo",
      user: { name: "Học viên", email: "hv@test.vn", phone: "0900000000" },
    });
    mocks.payosCreate.mockResolvedValue({
      paymentLinkId: "link-1",
      checkoutUrl: "https://payos.test/moi",
    });

    const result = await ensureServiceCheckout("b".repeat(32), USER);
    expect(result).toEqual({ ok: true, checkoutUrl: "https://payos.test/moi" });
    expect(mocks.payosCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        orderCode: 900_000_123,
        amount: 70_000,
        description: "HDI AI 900000123",
        buyerEmail: "hv@test.vn",
      }),
    );
  });

  it("không tạo link cho đơn đã đóng hoặc đã quá hạn", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "svc-1",
      code: 900_000_001,
      status: "pending",
      amountVnd: 50_000,
      expiresAt: new Date(Date.now() - 1_000),
      checkoutUrl: null,
      kind: "ai",
      user: { name: null, email: "hv@test.vn", phone: null },
    });
    expect(await ensureServiceCheckout("c".repeat(32), USER)).toMatchObject({
      ok: false,
      state: "closed",
    });
    expect(mocks.payosCreate).not.toHaveBeenCalled();
  });

  it("giữ đơn lại khi PayOS lỗi nhưng link vẫn tồn tại ở phía họ", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "svc-1",
      code: 900_000_001,
      status: "pending",
      amountVnd: 50_000,
      expiresAt: new Date(Date.now() + 3_600_000),
      checkoutUrl: null,
      kind: "ai",
      user: { name: null, email: "hv@test.vn", phone: null },
    });
    mocks.payosCreate.mockRejectedValue(new Error("mạng đứt"));
    mocks.payosGet.mockResolvedValue({ id: "link-cu" });

    const result = await ensureServiceCheckout("d".repeat(32), USER);
    expect(result).toMatchObject({ ok: false, state: "pending_gateway" });
    // Đơn KHÔNG bị hủy: hủy một đơn đã có link là mở đường cho link thứ hai.
    expect(mocks.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { provider: "payos", providerRef: "link-cu" },
      }),
    );
  });
});
