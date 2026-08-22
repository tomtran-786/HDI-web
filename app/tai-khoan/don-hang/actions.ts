"use server";

import { revalidatePath } from "next/cache";
import { parseId } from "@/lib/action-input";
import { auth } from "@/lib/auth";
import { allowUserAction } from "@/lib/auth-throttle";
import { cancelOrder } from "@/lib/orders";
import { ensurePayosCheckout } from "@/lib/payment-checkout";

const BUSY = "Bạn vừa thao tác quá nhiều lần. Vui lòng thử lại sau ít phút.";

/**
 * A student cancelling their own unpaid order.
 *
 * The order id comes from the browser, so the session's user id is passed down
 * into the `where` clause rather than checked against a row we fetched first.
 * Scoping the write is what makes guessing someone else's order id useless; a
 * fetch-then-compare would also work right up until someone edits it.
 *
 * `parseId` chạy trước mọi thứ khác vì tham số này đến từ payload RSC, nơi kiểu
 * `string` chỉ là lời hứa lúc biên dịch. Một object lọt xuống Prisma sẽ được
 * hiểu là bộ lọc chứ không phải giá trị.
 */
export async function cancelMyOrder(orderId: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, message: "Chưa đăng nhập." };

  const id = parseId(orderId);
  if (!id) return { ok: false, message: "Đơn hàng không hợp lệ." };
  // Mỗi lần hủy đều gọi sang PayOS để đóng link trước khi trả chỗ.
  if (!(await allowUserAction("order_cancel", session.user.id, 10))) {
    return { ok: false, message: BUSY };
  }

  const result = await cancelOrder(id, { userId: session.user.id });

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

export async function retryMyPayment(orderId: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, message: "Chưa đăng nhập." };

  const id = parseId(orderId);
  if (!id) return { ok: false as const, message: "Đơn hàng không hợp lệ." };
  // Mỗi lần thử lại có thể tạo một payment link PayOS mới.
  if (!(await allowUserAction("payment_retry", session.user.id, 10))) {
    return { ok: false as const, message: BUSY };
  }

  const result = await ensurePayosCheckout(id, session.user.id);
  revalidatePath("/tai-khoan/don-hang");
  return result.ok
    ? { ok: true as const, checkoutUrl: result.checkoutUrl }
    : { ok: false as const, message: result.message };
}
