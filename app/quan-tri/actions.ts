"use server";

import { revalidatePath } from "next/cache";
import { parseId } from "@/lib/action-input";
import { requireAdmin } from "@/lib/admin";
import { cancelOrder } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import type { CourseStatus } from "@/lib/generated/prisma/enums";

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
  revalidatePath("/");
}
