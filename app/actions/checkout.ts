"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { allowUserAction } from "@/lib/auth-throttle";
import { currentProfile } from "@/lib/current-profile";
import { isProfileComplete } from "@/lib/profile";
import { readCartIds, writeCartIds } from "@/lib/cart";
import { createOrder } from "@/lib/orders";
import { ensurePayosCheckout } from "@/lib/payment-checkout";

export type CheckoutState = { error?: string; refreshCatalog?: boolean };

const LANDING_CART = "/?cart=1";

/**
 * Turn the whole cookie cart into one server-priced order. There is no client
 * amount and no partial checkout: createOrder locks and validates every course
 * before writing any enrollment or order row.
 */
export async function checkout(
  _previous: CheckoutState,
  _formData: FormData,
): Promise<CheckoutState> {
  void _previous;
  void _formData;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/dang-nhap?tiep=${encodeURIComponent(LANDING_CART)}`);
  }

  const user = await currentProfile(session.user.id);
  if (!user) redirect("/dang-nhap");
  if (!isProfileComplete(user)) {
    redirect(`/hoan-tat-ho-so?tiep=${encodeURIComponent(LANDING_CART)}`);
  }

  // Mỗi lần chạy tới đây đều khóa hàng courses, tạo enrolment và gọi PayOS tạo
  // payment link. Xác thực nói người gọi là ai, không nói họ gọi bao nhiêu lần.
  if (!(await allowUserAction("checkout", session.user.id, 10))) {
    return {
      error: "Bạn vừa đặt đơn quá nhiều lần. Vui lòng thử lại sau ít phút.",
      refreshCatalog: true,
    };
  }

  const ids = await readCartIds();
  const result = await createOrder(session.user.id, ids);
  if (!result.ok) {
    return { error: result.message, refreshCatalog: true };
  }

  const payment = await ensurePayosCheckout(result.orderId, session.user.id);
  if (!payment.ok && payment.state !== "pending_gateway") {
    return { error: payment.message, refreshCatalog: true };
  }

  // createOrder is all-or-nothing, so every id from this request belongs to the
  // new order. Clear only after a recoverable PayOS/order destination exists.
  await writeCartIds([]);

  if (payment.ok) redirect(payment.checkoutUrl);
  redirect(`/tai-khoan/don-hang/${result.code}`);
}
