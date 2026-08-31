import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  readCartIds: vi.fn(),
  loadCart: vi.fn(),
  referralQuoteFor: vi.fn(),
  reconcile: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: mocks.findUnique } },
}));
vi.mock("@/lib/cart", () => ({
  readCartIds: mocks.readCartIds,
  loadCart: mocks.loadCart,
}));
vi.mock("@/lib/referral-quote", () => ({
  referralQuoteFor: mocks.referralQuoteFor,
}));
vi.mock("@/lib/orders", () => ({
  reconcileStaleOrdersForPayer: mocks.reconcile,
}));

import { GET } from "@/app/api/gio-hang/route";

describe("GET /api/gio-hang", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.referralQuoteFor.mockResolvedValue({
      eligible: false,
      creditBalanceVnd: 0,
    });
    mocks.reconcile.mockResolvedValue({ scanned: 0, expired: 0, released: 0 });
  });

  it("requires authentication before reading sales data", async () => {
    mocks.auth.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "auth_required" });
    expect(mocks.loadCart).not.toHaveBeenCalled();
  });

  it("requires a completed learner profile", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.findUnique.mockResolvedValue({ phone: null, stage: "other" });
    const response = await GET();
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "profile_required" });
    expect(mocks.loadCart).not.toHaveBeenCalled();
  });

  it("returns no-store public fields and strips course secrets", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "user-1", email: "nhomtruong@example.com" },
    });
    mocks.findUnique.mockResolvedValue({ phone: "0900000000", stage: "other" });
    mocks.readCartIds.mockResolvedValue(["course-1"]);
    mocks.loadCart.mockResolvedValue({
      catalog: [
        {
          id: "course-1",
          code: "AIQT",
          slug: "course",
          title: "Course",
          priceVnd: 500_000,
          capacity: 10,
          seatsLeft: 2,
          availability: "buyable",
          meetingUrl: "SECRET-MEETING",
          driveFolderId: "SECRET-DRIVE",
        },
      ],
      staleIds: ["gone"],
    });

    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(body).toEqual({
      // Giỏ hàng dùng địa chỉ này để bỏ qua email của chính nhóm trưởng, đúng
      // như `normalizeMemberEmails` làm ở server. Thiếu nó thì client đếm số
      // người nhiều hơn server một, và tổng tiền hai bên lệch nhau.
      email: "nhomtruong@example.com",
      catalog: [
        {
          id: "course-1",
          code: "AIQT",
          slug: "course",
          title: "Course",
          priceVnd: 500_000,
          capacity: 10,
          seatsLeft: 2,
          availability: "buyable",
        },
      ],
      staleIds: ["gone"],
      // Chỉ hai dữ kiện, không phải số tiền: giỏ hàng tự tính khoản trừ bằng
      // đúng các hàm mà `createOrder` gọi, nên không có phép tính thứ hai nào
      // để đi lệch với hóa đơn.
      referral: { eligible: false, creditBalanceVnd: 0 },
    });
    expect(JSON.stringify(body)).not.toContain("SECRET");
  });
  /**
   * Một lần checkout bị bỏ dở để lại ba thứ sai cùng lúc, vì cả `heldByUser`
   * lẫn `referralQuoteFor` đều đọc đơn `pending` mà không xét `expiresAt`: khóa
   * hiện "Đang chờ thanh toán" rồi bị gỡ khỏi giỏ, số dư credits vẫn bị trừ, và
   * ưu đãi 10% vẫn tính là đã dùng. Trước đây chỉ cron hằng ngày mới gỡ.
   */
  it("đóng đơn quá hạn của người này TRƯỚC khi đọc giỏ và báo giá", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1", email: "a@hdi.test" } });
    mocks.findUnique.mockResolvedValue({ phone: "0900000000", stage: "other" });
    mocks.readCartIds.mockResolvedValue([]);
    const order: string[] = [];
    mocks.reconcile.mockImplementation(async () => {
      order.push("reconcile");
      return { scanned: 1, expired: 1, released: 1 };
    });
    mocks.loadCart.mockImplementation(async () => {
      order.push("loadCart");
      return { catalog: [], selected: [], staleIds: [], totalVnd: 0 };
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(mocks.reconcile).toHaveBeenCalledWith("user-1");
    expect(order).toEqual(["reconcile", "loadCart"]);
  });

  /** Dọn dẹp hỏng không được phép làm sập giỏ hàng: phần tệ nhất còn lại chỉ là
   * con số cũ, đúng hành vi trước khi có bước này. */
  it("vẫn trả giỏ hàng khi bước dọn dẹp ném lỗi", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1", email: "a@hdi.test" } });
    mocks.findUnique.mockResolvedValue({ phone: "0900000000", stage: "other" });
    mocks.readCartIds.mockResolvedValue([]);
    mocks.reconcile.mockRejectedValue(new Error("PayOS gián đoạn"));
    mocks.loadCart.mockResolvedValue({
      catalog: [],
      selected: [],
      staleIds: [],
      totalVnd: 0,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(mocks.loadCart).toHaveBeenCalled();
  });
});
