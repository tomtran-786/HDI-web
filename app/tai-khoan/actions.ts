"use server";

import { revalidatePath } from "next/cache";
import { parseId } from "@/lib/action-input";
import { auth } from "@/lib/auth";
import { allowUserAction } from "@/lib/auth-throttle";
import { prisma } from "@/lib/prisma";
import { reconcileDriveFolder } from "@/lib/fulfillment";

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
