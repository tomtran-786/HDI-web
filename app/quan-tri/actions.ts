"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

// There is deliberately no `markPaid` here. Confirming payment is the payment
// webhook's job and only its job — a hand-operated button beside it is a second
// way for an enrolment to become `paid`, which is exactly how the two paths
// drift apart. `lib/enrollment.ts` holds the one confirm routine the webhook
// will call.

export async function markCancelled(enrollmentId: string) {
  await requireAdmin();

  await prisma.enrollment.updateMany({
    where: { id: enrollmentId, status: { in: ["pending", "paid"] } },
    // Revoking access is what actually closes the door — the status alone does
    // not, because hasLiveAccess() checks all three fields.
    data: { status: "cancelled", accessRevokedAt: new Date() },
  });

  revalidatePath("/quan-tri");
  return { ok: true, message: "Đã hủy ghi danh." };
}
