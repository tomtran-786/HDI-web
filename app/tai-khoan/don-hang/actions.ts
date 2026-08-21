"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { cancelOrder } from "@/lib/orders";
import { ensurePayosCheckout } from "@/lib/payment-checkout";

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
    : {
        ok: false,
        message:
          result.reason === "gateway_unavailable"
            ? "Chưa liên hệ được PayOS nên đơn vẫn được giữ để tránh hủy nhầm khoản đang thanh toán."
            : result.reason === "payment_in_progress"
              ? "PayOS đang xử lý hoặc đã nhận tiền; không thể tự động hủy đơn."
              : "Đơn này không còn ở trạng thái chờ thanh toán.",
      };
}

export async function retryMyPayment(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, message: "Chưa đăng nhập." };
  const result = await ensurePayosCheckout(orderId, session.user.id);
  revalidatePath("/tai-khoan/don-hang");
  return result.ok
    ? { ok: true as const, checkoutUrl: result.checkoutUrl }
    : { ok: false as const, message: result.message };
}
