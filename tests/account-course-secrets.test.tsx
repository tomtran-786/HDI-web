import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentSession: vi.fn(),
  enrollmentFindMany: vi.fn(),
  serviceOrderFindMany: vi.fn(),
  reviewFindMany: vi.fn(),
  courseFindMany: vi.fn(),
}));

vi.mock("@/lib/current-session", () => ({
  currentSession: mocks.currentSession,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    enrollment: { findMany: mocks.enrollmentFindMany },
    serviceOrder: { findMany: mocks.serviceOrderFindMany },
    courseReview: { findMany: mocks.reviewFindMany },
    course: { findMany: mocks.courseFindMany },
  },
}));
vi.mock("@/app/tai-khoan/actions", () => ({ retryDriveAccess: vi.fn() }));
vi.mock("@/app/tai-khoan/review-form", () => ({ ReviewForm: () => null }));

import AccountPage from "@/app/tai-khoan/page";

const communityUrl = "https://zalo.me/g/private-test-group";
const driveFolderId = "private-test-folder";

function enrollment(status: "pending" | "paid", drivePermissionId: string | null) {
  return {
    id: "enrollment-1",
    status,
    paidAt: status === "paid" ? new Date("2026-08-25T05:00:00Z") : null,
    createdAt: new Date("2026-08-25T04:00:00Z"),
    accessExpiresAt:
      status === "paid" ? new Date("2028-08-24T05:00:00Z") : null,
    accessRevokedAt: null,
    drivePermissionId,
    course: {
      id: "course-1",
      code: "AIQT",
      slug: "nckh-ung-dung-ai-xuat-ban-quoc-te",
    },
  };
}

describe("URL riêng của khóa học trong khu vực học viên", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.currentSession.mockResolvedValue({
      user: {
        id: "user-1",
        name: "Học viên",
        email: "student@example.com",
        image: null,
      },
    });
    mocks.serviceOrderFindMany.mockResolvedValue([]);
    mocks.reviewFindMany.mockResolvedValue([]);
    mocks.courseFindMany.mockResolvedValue([
      {
        id: "course-1",
        meetingUrl: null,
        communityUrl,
        driveFolderId,
      },
    ]);
  });

  it("chỉ hiện nhóm Zalo và Drive cho ghi danh paid còn quyền", async () => {
    mocks.enrollmentFindMany.mockResolvedValue([enrollment("paid", "permission-1")]);

    const html = renderToStaticMarkup(await AccountPage());
    expect(html).toContain(communityUrl);
    expect(html).toContain(`https://drive.google.com/drive/folders/${driveFolderId}`);
    expect(html).toContain("Vào nhóm Zalo");
    expect(html).toContain("Kho record");
  });

  it("không truy vấn hoặc lộ URL khi đơn còn pending", async () => {
    mocks.enrollmentFindMany.mockResolvedValue([enrollment("pending", null)]);

    const html = renderToStaticMarkup(await AccountPage());
    expect(mocks.courseFindMany).not.toHaveBeenCalled();
    expect(html).not.toContain(communityUrl);
    expect(html).not.toContain(driveFolderId);
    expect(html).toContain("sẽ mở ngay khi học phí được xác nhận");
  });
});
