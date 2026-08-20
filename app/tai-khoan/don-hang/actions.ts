"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { cancelOrder } from "@/lib/orders";

/**
 * A student cancelling their own unpaid order.
 *
 * The order id comes from the browser, so the session's user id is passed down
 * into the `where` clause rather than checked against a row we fetched first.
 * Scoping the write is what makes guessing someone else's order id useless; a
 * fetch-then-compare would also work right up until someone edits it.
 */
export async function cancelMyOrder(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, message: "Chưa đăng nhập." };

  const result = await cancelOrder(orderId, { userId: session.user.id });

  revalidatePath("/tai-khoan/don-hang");
  revalidatePath("/tai-khoan");

  return result.cancelled
    ? { ok: true, message: "Đã hủy đơn và trả lại chỗ." }
    : { ok: false, message: "Đơn này không còn ở trạng thái chờ thanh toán." };
}
