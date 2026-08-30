import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  cancelOrder: vi.fn(),
  reconcileDriveFolder: vi.fn(),
  paymentUpdateMany: vi.fn(),
  feedbackUpdateMany: vi.fn(),
  feedbackFindUnique: vi.fn(),
  sendFeedbackResolved: vi.fn(),
  enrollmentFindUnique: vi.fn(),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
}));
vi.mock("@/lib/admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/orders", () => ({ cancelOrder: mocks.cancelOrder }));
vi.mock("@/lib/fulfillment", () => ({
  reconcileDriveFolder: mocks.reconcileDriveFolder,
}));
vi.mock("@/lib/email", () => ({
  sendFeedbackResolvedEmail: mocks.sendFeedbackResolved,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    payment: { updateMany: mocks.paymentUpdateMany },
    feedback: {
      updateMany: mocks.feedbackUpdateMany,
      findUnique: mocks.feedbackFindUnique,
    },
    enrollment: { findUnique: mocks.enrollmentFindUnique },
    course: { update: vi.fn() },
    courseReview: { update: vi.fn() },
  },
}));

import {
  cancelPendingOrder,
  dismissFeedback,
  markFeedbackResolved,
  markPaymentReconciled,
  retryDriveAccessForEnrollment,
} from "@/app/quan-tri/actions";

const ID = "clh0000000000000000000000";

describe("action trang quản trị", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.requireAdmin.mockResolvedValue({ user: { id: "admin-1" } });
  });

  describe("cancelPendingOrder", () => {
    it("trả lời nhắn khi PayOS từ chối hủy — chính chỗ trước đây bị vứt đi", async () => {
      mocks.cancelOrder.mockResolvedValue({
        cancelled: false,
        reason: "payment_in_progress",
      });

      const result = await cancelPendingOrder(ID);

      expect(result).toEqual({
        ok: false,
        message: "PayOS chưa cho phép hủy đơn này.",
      });
    });

    it("trả ok khi hủy được", async () => {
      mocks.cancelOrder.mockResolvedValue({ cancelled: true });

      await expect(cancelPendingOrder(ID)).resolves.toMatchObject({ ok: true });
    });

    it("chặn người không phải admin trước khi chạm đơn hàng", async () => {
      mocks.requireAdmin.mockRejectedValue(new Error("Không có quyền."));

      await expect(cancelPendingOrder(ID)).rejects.toThrow();
      expect(mocks.cancelOrder).not.toHaveBeenCalled();
    });
  });

  describe("markPaymentReconciled", () => {
    it("chỉ ghi reconciledAt — không đụng tới status, đơn hay ghi danh", async () => {
      mocks.paymentUpdateMany.mockResolvedValue({ count: 1 });

      const result = await markPaymentReconciled(ID);

      expect(result.ok).toBe(true);
      const call = mocks.paymentUpdateMany.mock.calls[0][0];
      expect(Object.keys(call.data)).toEqual(["reconciledAt"]);
      // Cửa chống ghi đè: chỉ nhận dòng chưa từng được đối soát.
      expect(call.where).toMatchObject({ id: ID, reconciledAt: null });
    });

    it("báo đã đối soát trước đó thay vì ném lỗi khi không khớp dòng nào", async () => {
      mocks.paymentUpdateMany.mockResolvedValue({ count: 0 });

      await expect(markPaymentReconciled(ID)).resolves.toMatchObject({
        ok: false,
      });
    });

    it("chặn người không phải admin trước khi ghi", async () => {
      mocks.requireAdmin.mockRejectedValue(new Error("Không có quyền."));

      await expect(markPaymentReconciled(ID)).rejects.toThrow();
      expect(mocks.paymentUpdateMany).not.toHaveBeenCalled();
    });

    it.each([{}, ["x"], "", null, 123])(
      "từ chối id sai hình dạng (%j) mà không chạm database",
      async (bad) => {
        const result = await markPaymentReconciled(bad);

        expect(result.ok).toBe(false);
        expect(mocks.paymentUpdateMany).not.toHaveBeenCalled();
      },
    );
  });

  describe("xử lý feedback", () => {
    it("lần bấm thứ hai không gửi thêm email", async () => {
      mocks.feedbackUpdateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 0 });
      mocks.feedbackFindUnique.mockResolvedValue({
        kind: "idea",
        title: "Thêm bộ lọc",
        user: { name: "Lan", email: "lan@example.com" },
      });
      mocks.sendFeedbackResolved.mockResolvedValue({ sent: true });

      await expect(markFeedbackResolved(ID)).resolves.toMatchObject({ ok: true });
      await expect(markFeedbackResolved(ID)).resolves.toMatchObject({ ok: false });

      expect(mocks.feedbackUpdateMany).toHaveBeenNthCalledWith(1, {
        where: { id: ID, status: "open" },
        data: { status: "resolved", resolvedAt: expect.any(Date) },
      });
      expect(mocks.sendFeedbackResolved).toHaveBeenCalledTimes(1);
    });

    it("ghi log khi Resend từ chối thư đã xử lý nhưng vẫn đổi trạng thái", async () => {
      mocks.feedbackUpdateMany.mockResolvedValue({ count: 1 });
      mocks.feedbackFindUnique.mockResolvedValue({
        kind: "idea",
        title: "Thêm bộ lọc",
        user: { name: "Lan", email: "lan@example.com" },
      });
      mocks.sendFeedbackResolved.mockResolvedValue({
        sent: false,
        error: "sandbox_sender",
      });
      const quiet = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(markFeedbackResolved(ID)).resolves.toMatchObject({ ok: true });
      expect(quiet).toHaveBeenCalledWith(
        "[feedback] Thư báo đã xử lý bị từ chối:",
        "sandbox_sender",
      );

      quiet.mockRestore();
    });

    it("bỏ qua feedback mà không đọc người gửi hoặc gửi mail", async () => {
      mocks.feedbackUpdateMany.mockResolvedValue({ count: 1 });

      await expect(dismissFeedback(ID)).resolves.toMatchObject({ ok: true });

      expect(mocks.feedbackUpdateMany).toHaveBeenCalledWith({
        where: { id: ID, status: "open" },
        data: { status: "dismissed", resolvedAt: expect.any(Date) },
      });
      expect(mocks.feedbackFindUnique).not.toHaveBeenCalled();
      expect(mocks.sendFeedbackResolved).not.toHaveBeenCalled();
    });

    it("chặn người không phải admin trước khi ghi trạng thái", async () => {
      mocks.requireAdmin.mockRejectedValue(new Error("Không có quyền."));

      await expect(markFeedbackResolved(ID)).rejects.toThrow();
      expect(mocks.feedbackUpdateMany).not.toHaveBeenCalled();
    });
  });

  describe("retryDriveAccessForEnrollment", () => {
    it("gọi Drive đúng folder của ghi danh được chỉ định", async () => {
      mocks.enrollmentFindUnique.mockResolvedValue({
        id: ID,
        course: { driveFolderId: "folder-1" },
      });
      mocks.reconcileDriveFolder.mockResolvedValue(undefined);

      const result = await retryDriveAccessForEnrollment(ID);

      expect(result.ok).toBe(true);
      expect(mocks.reconcileDriveFolder).toHaveBeenCalledWith("folder-1", {
        enrollmentIds: [ID],
        limit: 1,
      });
    });

    it("từ chối id sai hình dạng — chốt duy nhất còn lại khi không lọc theo userId", async () => {
      // Bản admin cố tình KHÔNG thu hẹp theo userId, nên parseId là thứ duy nhất
      // ngăn một object lọt vào `where` và được Prisma đọc như bộ lọc.
      const result = await retryDriveAccessForEnrollment({ id: { not: "" } });

      expect(result.ok).toBe(false);
      expect(mocks.enrollmentFindUnique).not.toHaveBeenCalled();
    });

    it("nói ra khi khóa chưa gắn thư mục Drive", async () => {
      mocks.enrollmentFindUnique.mockResolvedValue({
        id: ID,
        course: { driveFolderId: null },
      });

      const result = await retryDriveAccessForEnrollment(ID);

      expect(result.ok).toBe(false);
      expect(mocks.reconcileDriveFolder).not.toHaveBeenCalled();
    });

    it("nuốt lỗi Google thành lời nhắn thay vì làm gãy trang", async () => {
      mocks.enrollmentFindUnique.mockResolvedValue({
        id: ID,
        course: { driveFolderId: "folder-1" },
      });
      mocks.reconcileDriveFolder.mockRejectedValue(new Error("quota"));
      const quiet = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(retryDriveAccessForEnrollment(ID)).resolves.toMatchObject({
        ok: false,
      });

      quiet.mockRestore();
    });

    it("chặn người không phải admin", async () => {
      mocks.requireAdmin.mockRejectedValue(new Error("Không có quyền."));

      await expect(retryDriveAccessForEnrollment(ID)).rejects.toThrow();
      expect(mocks.enrollmentFindUnique).not.toHaveBeenCalled();
    });
  });
});
