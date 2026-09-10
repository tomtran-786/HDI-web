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
import { orderPage } from "@/content/checkout";

const OPEN_STATUSES = { in: ["pending", "paid"] };
/**
 * Ngoại lệ cho bộ lọc "chỉ đơn còn sống": đơn đã đóng nhưng đã có tiền chạm vào.
 * Một khoản chuyển khoản về sau lượt quét 03:00 dừng ở `requires_review` mà
 * KHÔNG mở lại đơn, nên lọc thuần theo `status` sẽ giấu mất chính đơn của người
 * vừa trả tiền thật.
 */
const HAS_PAYMENT = {
  payments: { some: { status: { in: ["succeeded", "requires_review"] } } },
};

function order(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "order-1",
    code: 1001,
    status: "paid",
    amountVnd: 3_000_000,
    createdAt: new Date("2026-08-25T04:00:00Z"),
    expiresAt: new Date("2026-08-25T10:00:00Z"),
    groupSize: 1,
    items: [{ id: "item-1", course: { code: "AIQT", slug: "aiqt" } }],
    // Chỉ chứa hàng `requires_review`; query đã lọc sẵn ở tầng Prisma.
    payments: [],
    ...overrides,
  };
}

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
        where: expect.objectContaining({
          OR: [{ status: OPEN_STATUSES }, HAS_PAYMENT],
        }),
      }),
    );
  });

  /**
   * `hasLiveAccess` có ba vế; `accessRevokedAt` chỉ là một. Một ghi danh `paid`
   * chưa bị thu hồi nhưng đã qua `accessExpiresAt` cũng phải biến mất, và trước
   * đây không test nào chạm vào nhánh đó.
   */
  it("ghi danh paid nhưng đã hết hạn truy cập thì không hiện", async () => {
    mocks.enrollmentFindMany.mockResolvedValue([
      enrollment({
        id: "expired-access",
        accessExpiresAt: new Date("2020-01-01T00:00:00Z"),
        accessRevokedAt: null,
        course: { id: "course-gone", code: "EXPIREDCODE", slug: "expired-slug" },
      }),
    ]);

    const html = renderToStaticMarkup(await AccountPage());

    expect(html).not.toContain("EXPIREDCODE");
    expect(html).toContain("Bạn chưa mua khóa học nào");
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

  it("danh sách đơn hàng lọc đơn còn sống, cộng đơn đã có giao dịch", async () => {
    await OrderListPage();

    expect(mocks.orderFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user-1",
          OR: [{ status: OPEN_STATUSES }, HAS_PAYMENT],
        },
      }),
    );
  });

  it("chỉ hỏi những hàng payments còn treo, không kéo theo payload thô", async () => {
    await OrderListPage();

    expect(mocks.orderFindMany.mock.calls[0][0].select.payments).toEqual({
      where: { status: "requires_review" },
      select: { id: true },
      take: 1,
    });
  });

  it("đơn quá hạn còn khoản tiền treo thì hiện kèm ghi chú đối soát", async () => {
    mocks.orderFindMany.mockResolvedValue([
      order({ code: 1042, status: "expired", payments: [{ id: "pay-1" }] }),
    ]);

    const html = renderToStaticMarkup(await OrderListPage());

    expect(html).toContain("1042");
    expect(html).toContain(orderPage.reconciling);
  });

  /**
   * Đơn đã hoàn tiền cũng lọt vào danh sách qua nhánh `payments.some` — nó có
   * một giao dịch `succeeded`. Nhưng tiền của nó đã được xử lý xong, và dán
   * "đang đối soát" lên đó là nói sai với chính người vừa nhận lại tiền.
   */
  it("đơn đã hoàn tiền hiện ra nhưng KHÔNG mang ghi chú đối soát", async () => {
    mocks.orderFindMany.mockResolvedValue([
      order({ code: 1043, status: "refunded", payments: [] }),
    ]);

    const html = renderToStaticMarkup(await OrderListPage());

    expect(html).toContain("1043");
    expect(html).toContain("Đã hoàn tiền");
    expect(html).not.toContain(orderPage.reconciling);
  });

  it("đơn còn sống không mang ghi chú đối soát", async () => {
    mocks.orderFindMany.mockResolvedValue([order({ status: "paid" })]);

    const html = renderToStaticMarkup(await OrderListPage());

    expect(html).not.toContain(orderPage.reconciling);
  });

  /**
   * Câu "đơn đã đóng không hiển thị" từng bị gate bằng `orders.length > 0`, tức
   * ẩn đi đúng lúc cần nhất: người có toàn đơn đã hủy chỉ đọc được "chưa có đơn
   * hàng nào" — một câu sai.
   */
  it("danh sách rỗng vẫn nói rõ trang này chỉ liệt kê đơn nào", async () => {
    const html = renderToStaticMarkup(await OrderListPage());

    expect(html).toContain(orderPage.listScope);
    expect(html).toContain(orderPage.listEmptyNote);
  });
});
