"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { COURSES_TAG, REVIEWS_TAG } from "@/lib/cache-tags";
import { parseId } from "@/lib/action-input";
import { requireAdmin } from "@/lib/admin";
import {
  fulfillOrderDrive,
  notifyGroupMembers,
  notifyReferralCommission,
  reconcileDriveFolder,
} from "@/lib/fulfillment";
import { cancelOrder, grantReviewedPayment } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { sendFeedbackResolvedEmail } from "@/lib/email";
import type { CourseStatus, ReviewStatus } from "@/lib/generated/prisma/enums";

// There is deliberately no `markPaid` here. Confirming payment is the payment
// webhook's job and only its job — a hand-operated button beside it is a second
// way for an enrolment to become `paid`, which is exactly how the two paths
// drift apart. `lib/enrollment.ts` holds the one confirm routine the webhook
// will call.

/**
 * Không như các action phía học viên, chỗ này KHÔNG có `userId` trong `where`
 * để thu hẹp phạm vi — admin được phép hủy đơn của bất kỳ ai. Vì vậy hình dạng
 * của `orderId` là thứ duy nhất đứng giữa một object lọt vào Prisma và việc hủy
 * nhầm "đơn pending đầu tiên khớp" thay vì đơn được chỉ định.
 */
export async function cancelPendingOrder(orderId: unknown) {
  await requireAdmin();
  const id = parseId(orderId);
  if (!id) return { ok: false, message: "Mã đơn không hợp lệ." };
  const result = await cancelOrder(id);

  revalidatePath("/quan-tri");
  if (result.cancelled) revalidateTag(COURSES_TAG, { expire: 0 });
  return result.cancelled
    ? { ok: true, message: "Đã hủy đơn PayOS và ghi danh đang chờ." }
    : { ok: false, message: "PayOS chưa cho phép hủy đơn này." };
}

export async function updateCourseStatus(formData: FormData) {
  await requireAdmin();
  const courseId = parseId(formData.get("courseId"));
  const status = String(formData.get("status") ?? "");
  const allowed = new Set<CourseStatus>(["draft", "open", "running", "closed"]);
  if (!courseId || !allowed.has(status as CourseStatus)) {
    throw new Error("Trạng thái khóa học không hợp lệ.");
  }
  await prisma.course.update({
    where: { id: courseId },
    data: { status: status as CourseStatus },
  });
  revalidatePath("/quan-tri");
  revalidateTag(COURSES_TAG, { expire: 0 });
}

/**
 * Duyệt hoặc từ chối một đánh giá.
 *
 * `requireAdmin()` chứ không dựa vào layout của /quan-tri: layout bảo vệ TRANG,
 * còn đây là một endpoint POST riêng mà bất kỳ ai có cookie phiên hợp lệ và
 * đúng action id đều gọi được — canh cái nút mà không canh tay xử lý của nó là
 * không canh gì cả.
 *
 * Không có nhánh nào sửa `rating` hay `comment`: quản trị viên quyết định đánh
 * giá có được đăng hay không, chứ không viết lại lời của học viên.
 */
export async function moderateReview(formData: FormData) {
  await requireAdmin();
  const reviewId = parseId(formData.get("reviewId"));
  const status = String(formData.get("status") ?? "");
  const allowed = new Set<ReviewStatus>(["published", "rejected"]);
  if (!reviewId || !allowed.has(status as ReviewStatus)) {
    throw new Error("Thao tác duyệt đánh giá không hợp lệ.");
  }

  await prisma.courseReview.update({
    where: { id: reviewId },
    data: { status: status as ReviewStatus, moderatedAt: new Date() },
  });

  revalidatePath("/quan-tri");
  // Trang chủ là route động vì nonce CSP; dữ liệu đánh giá mới là phần được
  // cache, nên phải xóa đúng tag thay vì revalidate full-route cache không có.
  revalidateTag(REVIEWS_TAG, { expire: 0 });
}

/**
 * Gỡ một giao dịch khỏi hàng chờ đối soát thủ công.
 *
 * KHÔNG phải nút "đã thanh toán". Nó chỉ ghi lại rằng một con người đã đọc qua
 * giao dịch này, để hàng chờ đừng lặp lại mãi cùng một dòng — trạng thái đơn,
 * ghi danh và quyền truy cập không đổi một chữ nào. Xác nhận thanh toán vẫn chỉ
 * là việc của webhook, đúng như ghi chú ở đầu file: một cái nút bấm tay cạnh nó
 * là con đường thứ hai để một ghi danh thành `paid`, và hai con đường thì sớm
 * muộn cũng lệch nhau.
 *
 * Nếu về sau webhook về muộn và tự xử lý đúng, dòng đó rời hàng chờ theo điều
 * kiện `status` như trước — `reconciledAt` không cản gì.
 */
export async function markPaymentReconciled(paymentId: unknown) {
  await requireAdmin();
  const id = parseId(paymentId);
  if (!id) return { ok: false, message: "Mã giao dịch không hợp lệ." };

  // updateMany chứ không update: `where` không khớp thì trả count 0 thay vì ném
  // P2025, và ở đây "giao dịch đã biến mất" không phải chuyện đáng làm gãy trang.
  const done = await prisma.payment.updateMany({
    where: { id, reconciledAt: null },
    data: { reconciledAt: new Date() },
  });

  revalidatePath("/quan-tri");
  return done.count > 0
    ? { ok: true, message: "Đã đánh dấu giao dịch là đã đối soát." }
    : { ok: false, message: "Giao dịch này đã được đối soát trước đó." };
}

/**
 * Cấp quyền cho một giao dịch `requires_review` — thường là tiền về sau hạn giữ
 * chỗ nên webhook đã không tự cấp.
 *
 * Đây KHÔNG mâu thuẫn với "không có nút đã thanh toán": `grantReviewedPayment`
 * chạy đúng cái cổng `reclaimLatePayment` mà webhook đã chạy (đếm ghế, ràng buộc
 * ghi danh, số dư credits), chỉ bỏ ràng buộc khoảng ân hạn vì đã có người xác
 * nhận tiền có thật. Cấp quyền vẫn đi qua một đường duy nhất.
 *
 * Ghế đã hết thì trả về `ok: false` kèm lý do — quản trị viên chuyển sang "Cần
 * hoàn tiền".
 */
export async function grantPendingPayment(paymentId: unknown) {
  await requireAdmin();
  const id = parseId(paymentId);
  if (!id) return { ok: false, message: "Mã giao dịch không hợp lệ." };

  // `grantReviewedPayment` NÉM khi lệnh flip đơn không còn khớp `pending`/
  // `expired` — thường là một lượt webhook chạy trước vừa xác nhận xong. Đó là
  // kết quả tốt, không phải lỗi để làm gãy trang: bắt lại và nói cho người bấm.
  let result: Awaited<ReturnType<typeof grantReviewedPayment>>;
  try {
    result = await grantReviewedPayment(id);
  } catch (error) {
    console.error("[quan-tri] Cấp quyền giao dịch treo hỏng:", error);
    revalidatePath("/quan-tri");
    return {
      ok: false,
      message: "Đơn vừa được xử lý ở một luồng khác. Tải lại trang để xem trạng thái mới.",
    };
  }
  if (!result.granted) {
    revalidatePath("/quan-tri");
    return { ok: false, message: result.message };
  }

  // Phần giao hàng chạy NGOÀI transaction, y hệt route webhook: cấp quyền Drive
  // rồi báo cho thành viên và người giới thiệu. Lỗi ở đây được log và nuốt —
  // đơn đã `paid`, cron ngày và các nút cấp lại quyền là lưới đỡ.
  await fulfillOrderDrive(result.orderId).catch((error) =>
    console.error(`[quan-tri] Đơn ${result.orderId} đã paid nhưng Drive lỗi:`, error),
  );
  await notifyGroupMembers(result.orderId).catch((error) =>
    console.error(`[quan-tri] Đơn ${result.orderId} không báo được cho thành viên:`, error),
  );
  await notifyReferralCommission(result.orderId).catch((error) =>
    console.error(`[quan-tri] Đơn ${result.orderId} không báo được credits:`, error),
  );

  revalidatePath("/quan-tri");
  revalidateTag(COURSES_TAG, { expire: 0 });
  return { ok: true, message: "Đã cấp quyền và xác nhận thanh toán." };
}

/**
 * Đánh dấu một giao dịch `requires_review` là "cần hoàn tiền".
 *
 * Chỉ đóng dấu `reconciledAt` để dòng rời hàng chờ — trạng thái đơn và ghi danh
 * giữ nguyên. Việc hoàn tiền thật làm thủ công trên PayOS; hệ thống không có
 * đường tự hoàn.
 */
export async function flagPaymentForRefund(paymentId: unknown) {
  await requireAdmin();
  const id = parseId(paymentId);
  if (!id) return { ok: false, message: "Mã giao dịch không hợp lệ." };

  const done = await prisma.payment.updateMany({
    where: { id, reconciledAt: null, status: "requires_review" },
    data: { reconciledAt: new Date() },
  });

  revalidatePath("/quan-tri");
  return done.count > 0
    ? { ok: true, message: "Đã ghi nhận cần hoàn tiền. Hoàn thủ công trên PayOS." }
    : { ok: false, message: "Giao dịch này không còn trong hàng chờ." };
}

async function setFeedbackStatus(
  feedbackId: unknown,
  next: "resolved" | "dismissed",
) {
  await requireAdmin();
  const id = parseId(feedbackId);
  if (!id) return { ok: false, message: "Mã góp ý không hợp lệ." };

  // Cửa idempotency nằm trong chính câu UPDATE: hai request cùng bấm một dòng
  // không thể cùng đổi `open`, nên cũng không thể cùng gửi hai lá thư.
  const done = await prisma.feedback.updateMany({
    where: { id, status: "open" },
    data: { status: next, resolvedAt: new Date() },
  });
  if (done.count === 0) {
    return { ok: false, message: "Góp ý này đã được xử lý trước đó." };
  }

  if (next === "resolved") {
    const feedback = await prisma.feedback.findUnique({
      where: { id },
      select: {
        kind: true,
        title: true,
        user: { select: { name: true, email: true } },
      },
    });
    if (feedback) {
      try {
        const result = await sendFeedbackResolvedEmail({
          to: feedback.user.email,
          name: feedback.user.name,
          kind: feedback.kind,
          title: feedback.title,
        });
        if (!result.sent) {
          console.error("[feedback] Thư báo đã xử lý bị từ chối:", result.error);
        }
      } catch (error) {
        console.error("[feedback] Không gửi được thư đã xử lý:", error);
      }
    }
  }

  revalidatePath("/quan-tri");
  return next === "resolved"
    ? { ok: true, message: "Đã đánh dấu góp ý là đã xử lý." }
    : { ok: true, message: "Đã bỏ qua góp ý." };
}

export async function markFeedbackResolved(id: unknown) {
  return setFeedbackStatus(id, "resolved");
}

export async function dismissFeedback(id: unknown) {
  return setFeedbackStatus(id, "dismissed");
}

/**
 * Cấp lại quyền Drive cho một ghi danh bất kỳ.
 *
 * Bản song song của `retryDriveAccess` ở app/tai-khoan/actions.ts, khác đúng một
 * điểm: KHÔNG thu hẹp theo `userId`, vì quản trị viên thao tác trên ghi danh của
 * người khác. Mất lớp đó thì `parseId` là thứ duy nhất còn đứng giữa một object
 * lọt vào `where` và việc Prisma đọc nó như bộ lọc rồi cấp quyền cho nhầm
 * người — nên nó không phải thủ tục, nó là cái chốt.
 */
export async function retryDriveAccessForEnrollment(enrollmentId: unknown) {
  await requireAdmin();
  const id = parseId(enrollmentId);
  if (!id) return { ok: false, message: "Mã ghi danh không hợp lệ." };

  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    select: { id: true, course: { select: { driveFolderId: true } } },
  });
  if (!enrollment) return { ok: false, message: "Không tìm thấy ghi danh." };
  if (!enrollment.course.driveFolderId) {
    return { ok: false, message: "Khóa học này chưa gắn thư mục Drive." };
  }

  try {
    await reconcileDriveFolder(enrollment.course.driveFolderId, {
      enrollmentIds: [enrollment.id],
      limit: 1,
    });
  } catch (error) {
    // Google trả lỗi là chuyện thường gặp ở đây (quota, folder bị đổi quyền).
    // Nói ra chứ không nuốt: quản trị viên cần biết để đi sửa bên Drive.
    console.error("[quan-tri] Cấp lại quyền Drive hỏng:", error);
    return { ok: false, message: "Google Drive từ chối. Xem log để biết lý do." };
  }

  revalidatePath("/quan-tri");
  return { ok: true, message: "Đã gửi yêu cầu cấp lại quyền Drive." };
}
