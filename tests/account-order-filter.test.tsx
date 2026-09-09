import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentSession: vi.fn(),
  enrollmentFindMany: vi.fn(),
  serviceOrderFindMany: vi.fn(),
  reviewFindMany: vi.fn(),
  courseFindMany: vi.fn(),
  orderFindMany: vi.fn(),
}));

vi.mock("@/lib/current-session", () => ({ currentSession: mocks.currentSession }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    enrollment: { findMany: mocks.enrollmentFindMany },
    serviceOrder: { findMany: mocks.serviceOrderFindMany },
    courseReview: { findMany: mocks.reviewFindMany },
    course: { findMany: mocks.courseFindMany },
    order: { findMany: mocks.orderFindMany },
  },
}));
vi.mock("@/app/tai-khoan/actions", () => ({ retryDriveAccess: vi.fn() }));
vi.mock("@/app/tai-khoan/review-form", () => ({ ReviewForm: () => null }));

import AccountPage from "@/app/tai-khoan/page";
import OrderListPage from "@/app/tai-khoan/don-hang/page";

const OPEN_STATUSES = { in: ["pending", "paid"] };

function enrollment(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: "enrollment-live",
    status: "paid",
    paidAt: new Date("2026-08-25T05:00:00Z"),
    createdAt: new Date("2026-08-25T04:00:00Z"),
    accessExpiresAt: new Date("2099-01-01T00:00:00Z"),
    accessRevokedAt: null,
    drivePermissionId: null,
    orderItems: [
      { order: { userId: "user-1", user: { email: "hv@hdi.test" } } },
    ],
    course: { id: "course-live", code: "LIVECODE", slug: "live-course-slug" },
    ...overrides,
  };
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.currentSession.mockResolvedValue({
    user: { id: "user-1", name: "Học viên", email: "hv@example.com", image: null },
  });
  mocks.enrollmentFindMany.mockResolvedValue([]);
  mocks.serviceOrderFindMany.mockResolvedValue([]);
  mocks.reviewFindMany.mockResolvedValue([]);
  mocks.courseFindMany.mockResolvedValue([]);
  mocks.orderFindMany.mockResolvedValue([]);
});

describe("khu vực học viên chỉ giữ đơn còn sống", () => {
  it("query ghi danh và đơn dịch vụ lọc theo status pending/paid", async () => {
    await AccountPage();

    expect(mocks.enrollmentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: OPEN_STATUSES }),
      }),
    );
    expect(mocks.serviceOrderFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: OPEN_STATUSES }),
      }),
    );
  });

  it("ghi danh paid nhưng đã thu hồi quyền thì không hiện, pending thì hiện", async () => {
    mocks.enrollmentFindMany.mockResolvedValue([
      enrollment({
        id: "revoked",
        accessRevokedAt: new Date("2026-09-01T00:00:00Z"),
        course: { id: "course-revoked", code: "REVOKEDCODE", slug: "revoked-slug" },
      }),
      enrollment({
        id: "pending",
        status: "pending",
        paidAt: null,
        accessExpiresAt: null,
        course: { id: "course-pending", code: "PENDINGCODE", slug: "pending-slug" },
      }),
    ]);

    const html = renderToStaticMarkup(await AccountPage());

    expect(html).not.toContain("REVOKEDCODE");
    expect(html).toContain("PENDINGCODE");
  });

  it("danh sách đơn hàng lọc theo status pending/paid", async () => {
    await OrderListPage();

    expect(mocks.orderFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
          status: OPEN_STATUSES,
        }),
      }),
    );
  });
});
