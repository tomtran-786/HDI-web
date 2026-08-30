import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  readCartIds: vi.fn(),
  loadCart: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: mocks.findUnique } },
}));
vi.mock("@/lib/cart", () => ({
  readCartIds: mocks.readCartIds,
  loadCart: mocks.loadCart,
}));

import { GET } from "@/app/api/gio-hang/route";

describe("GET /api/gio-hang", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
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
    });
    expect(JSON.stringify(body)).not.toContain("SECRET");
  });
});
