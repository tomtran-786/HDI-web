"use server";

import { revalidatePath } from "next/cache";
import { parseId } from "@/lib/action-input";
import { auth } from "@/lib/auth";
import { allowUserAction } from "@/lib/auth-throttle";
import { prisma } from "@/lib/prisma";
import { reconcileDriveFolder } from "@/lib/fulfillment";
import { canReview, isValidRating, normalizeComment } from "@/lib/reviews";

/**
 * Cấp lại quyền Drive cho một enrolment của chính người đang đăng nhập.
 *
 * `parseId` trước tiên: id đến từ payload RSC nên kiểu `string` chỉ có giá trị
 * lúc biên dịch, và một object lọt vào `where` sẽ được Prisma đọc như bộ lọc.
 * Throttle chặt hơn các action khác vì mỗi lần bấm là một chuỗi gọi API Google
 * Drive kèm lease trên đúng một folder.
 */
export async function retryDriveAccess(enrollmentId: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false };

  const id = parseId(enrollmentId);
  if (!id) return { ok: false };
  if (!(await allowUserAction("drive_retry", session.user.id, 5))) {
    return { ok: false };
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id,
      userId: session.user.id,
      status: "paid",
      accessRevokedAt: null,
      OR: [{ accessExpiresAt: null }, { accessExpiresAt: { gt: new Date() } }],
    },
    select: { id: true, course: { select: { driveFolderId: true } } },
  });
  if (!enrollment?.course.driveFolderId) return { ok: false };
  await reconcileDriveFolder(enrollment.course.driveFolderId, {
    enrollmentIds: [enrollment.id],
    limit: 1,
  });
  revalidatePath("/tai-khoan");
  return { ok: true };
}

export type ReviewState = { error?: string; saved?: boolean };

/**
 * Ghi đánh giá của chính người đang đăng nhập cho một khóa họ đã trả tiền.
 *
 * Bốn cửa, theo đúng thứ tự rẻ-tiền-trước:
 *   1. `auth()` — server action là endpoint POST riêng, không thừa hưởng bất kỳ
 *      kiểm tra nào của trang đã render ra cái form.
 *   2. `parseId` — `courseId` đến từ payload RSC, nên kiểu `string` chỉ có giá
 *      trị lúc biên dịch; một object lọt vào `where` được Prisma đọc như bộ lọc.
 *   3. hình dạng của rating/comment.
 *   4. `canReview` — cửa duy nhất phân biệt học viên với người qua đường. Bỏ nó
 *      thì mọi tài khoản đăng nhập đều chấm sao được cho khóa chưa từng học.
 *
 * Sửa đánh giá luôn đưa trạng thái về `pending`: nội dung đã đổi thì lần duyệt
 * trước không còn nói gì về nội dung mới.
 */
export async function saveReview(
  _previous: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Bạn cần đăng nhập để đánh giá." };

  const courseId = parseId(formData.get("courseId"));
  if (!courseId) return { error: "Khóa học không hợp lệ." };

  const rating = Number(formData.get("rating"));
  if (!isValidRating(rating)) {
    return { error: "Vui lòng chọn số sao từ 1 đến 5." };
  }
  const comment = normalizeComment(formData.get("comment"));

  if (!(await allowUserAction("course_review", session.user.id, 20))) {
    return { error: "Bạn vừa gửi quá nhiều lần. Vui lòng thử lại sau ít phút." };
  }

  if (!(await canReview(session.user.id, courseId))) {
    return { error: "Chỉ học viên đã thanh toán khóa này mới đánh giá được." };
  }

  await prisma.courseReview.upsert({
    where: { courseId_userId: { courseId, userId: session.user.id } },
    create: { courseId, userId: session.user.id, rating, comment },
    update: { rating, comment, status: "pending", moderatedAt: null },
  });

  revalidatePath("/tai-khoan");
  return { saved: true };
}
