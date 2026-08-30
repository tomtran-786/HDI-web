import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  orderFindFirst: vi.fn(),
  itemUpdateMany: vi.fn(),
  itemCount: vi.fn(),
  acquireLease: vi.fn(),
  renewLease: vi.fn(),
  releaseLease: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: { findFirst: mocks.orderFindFirst },
    orderItem: { count: mocks.itemCount, updateMany: mocks.itemUpdateMany },
    enrollment: { findMany: vi.fn(), count: vi.fn(), updateMany: vi.fn() },
  },
}));
vi.mock("@/lib/external-lease", () => ({ acquireExternalLease: mocks.acquireLease }));
vi.mock("@/lib/google-drive", () => ({
  grantDrivePermission: vi.fn(),
  revokeDrivePermission: vi.fn(),
}));
vi.mock("@/lib/email", () => ({
  sendGroupMemberEnrolledEmail: mocks.sendEmail,
}));

import { notifyGroupMembers } from "@/lib/fulfillment";

const SLUG = "training-tieu-luan-nckh-kltn";

function order(items: unknown[]) {
  mocks.orderFindFirst.mockResolvedValue({
    code: 100001,
    userId: "payer",
    user: { name: "Nhóm trưởng", email: "payer@hdi.test" },
    items,
  });
}

const seat = (memberUserId: string, id: string, slug = SLUG) => ({
  id,
  memberUserId,
  member: { name: "Bạn B", email: `${memberUserId}@hdi.test` },
  course: { slug },
});

describe("báo cho thành viên rằng nhóm trưởng đã trả tiền giúp", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.acquireLease.mockResolvedValue({
      renew: mocks.renewLease,
      release: mocks.releaseLease,
    });
    mocks.renewLease.mockResolvedValue(true);
    mocks.releaseLease.mockResolvedValue(undefined);
    mocks.itemCount.mockResolvedValue(1);
    mocks.itemUpdateMany.mockResolvedValue({ count: 1 });
    mocks.sendEmail.mockResolvedValue({ sent: true, id: "email-1" });
  });

  it("không gửi gì cho chính người trả tiền", async () => {
    order([seat("payer", "item-1")]);
    await expect(notifyGroupMembers("order-1")).resolves.toEqual({ notified: 0 });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("gộp nhiều khóa của một người vào MỘT lá thư", async () => {
    order([
      seat("member", "item-1"),
      seat("member", "item-2", "nckh-ung-dung-ai-xuat-ban-quoc-te"),
    ]);
    await expect(notifyGroupMembers("order-1")).resolves.toEqual({ notified: 1 });
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1);
    expect(mocks.sendEmail.mock.calls[0][0].courseTitles).toHaveLength(2);
  });

  /**
   * Lỗi cũ: `sendEmail` báo Resend từ chối bằng `{ sent: false }` chứ không
   * throw, nên `catch` không bao giờ chạy và một lá thư chưa từng rời khỏi
   * Resend vẫn được đếm là đã gửi.
   */
  it("không đếm một lá thư bị Resend từ chối là đã gửi", async () => {
    order([seat("member", "item-1")]);
    mocks.sendEmail.mockResolvedValue({ sent: false, error: "sandbox_sender" });
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(notifyGroupMembers("order-1")).resolves.toEqual({ notified: 0 });
    // Và không đóng dấu: lượt webhook sau phải còn cơ hội gửi lại.
    expect(mocks.itemUpdateMany).not.toHaveBeenCalled();
    expect(quiet).toHaveBeenCalledWith(expect.stringContaining("sandbox_sender"));
    quiet.mockRestore();
  });

  it("chỉ đóng dấu đã gửi SAU khi Resend nhận thư", async () => {
    order([seat("member", "item-1"), seat("member", "item-2")]);
    await notifyGroupMembers("order-1");
    expect(mocks.itemUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ["item-1", "item-2"] }, notifiedAt: null },
      data: { notifiedAt: expect.any(Date) },
    });
  });

  /**
   * Webhook được giao lại sẽ chạy lại hàm này. Hàng chờ phải lọc theo
   * `notifiedAt: null`, nếu không mỗi lần PayOS gửi lại là một thư trùng.
   */
  it("chỉ lấy những dòng đơn chưa được báo", async () => {
    order([]);
    await notifyGroupMembers("order-1");
    const select = mocks.orderFindFirst.mock.calls[0][0].select;
    expect(select.items.where).toEqual({ notifiedAt: null });
  });

  it("không gửi trùng khi một webhook khác đang giữ lease của thành viên", async () => {
    order([seat("member", "item-1")]);
    mocks.acquireLease.mockResolvedValue(null);

    await expect(notifyGroupMembers("order-1")).resolves.toEqual({ notified: 0 });
    expect(mocks.acquireLease).toHaveBeenCalledWith("group-email:order-1:member");
    expect(mocks.itemCount).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("đọc lại notifiedAt sau lease để không gửi theo snapshot cũ", async () => {
    order([seat("member", "item-1")]);
    // Worker vừa nhả lease trước đã gửi và đóng dấu tất cả các dòng của người này.
    mocks.itemCount.mockResolvedValue(0);

    await expect(notifyGroupMembers("order-1")).resolves.toEqual({ notified: 0 });
    expect(mocks.itemCount).toHaveBeenCalledWith({
      where: { id: { in: ["item-1"] }, notifiedAt: null },
    });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.releaseLease).toHaveBeenCalledOnce();
  });

  it("nhả lease ngay cả khi Resend ném lỗi", async () => {
    order([seat("member", "item-1")]);
    mocks.sendEmail.mockRejectedValue(new Error("mailbox full"));
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(notifyGroupMembers("order-1")).resolves.toEqual({ notified: 0 });
    expect(mocks.releaseLease).toHaveBeenCalledOnce();
    quiet.mockRestore();
  });

  it("lỗi lấy lease của một người không chặn thư của người kế tiếp", async () => {
    order([seat("member-a", "item-1"), seat("member-b", "item-2")]);
    mocks.acquireLease.mockRejectedValueOnce(new Error("database unavailable"));
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(notifyGroupMembers("order-1")).resolves.toEqual({ notified: 1 });
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1);
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "member-b@hdi.test" }),
    );
    expect(mocks.releaseLease).toHaveBeenCalledOnce();
    quiet.mockRestore();
  });

  it("một hộp thư hỏng không chặn thư của những người còn lại", async () => {
    order([seat("member-a", "item-1"), seat("member-b", "item-2")]);
    mocks.sendEmail
      .mockRejectedValueOnce(new Error("mailbox full"))
      .mockResolvedValueOnce({ sent: true, id: "email-2" });

    await expect(notifyGroupMembers("order-1")).resolves.toEqual({ notified: 1 });
  });
});
