"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { cancelOrder } from "@/lib/orders";

// There is deliberately no `markPaid` here. Confirming payment is the payment
// webhook's job and only its job — a hand-operated button beside it is a second
// way for an enrolment to become `paid`, which is exactly how the two paths
// drift apart. `lib/enrollment.ts` holds the one confirm routine the webhook
// will call.

export async function cancelPendingOrder(orderId: string) {
  await requireAdmin();
  const result = await cancelOrder(orderId);

  revalidatePath("/quan-tri");
  return result.cancelled
    ? { ok: true, message: "Đã hủy đơn PayOS và ghi danh đang chờ." }
    : { ok: false, message: "PayOS chưa cho phép hủy đơn này." };
}
