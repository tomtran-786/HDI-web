"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { allowUserAction } from "@/lib/auth-throttle";
import { currentProfile } from "@/lib/current-profile";
import { isProfileComplete } from "@/lib/profile";
import { readCartIds, writeCartIds } from "@/lib/cart";
import { normalizeMemberEmails, resolveGroupMembers } from "@/lib/group-members";
import { cancelOrder, createOrder } from "@/lib/orders";
import { ensurePayosCheckout } from "@/lib/payment-checkout";
import { COURSES_TAG } from "@/lib/cache-tags";

export type CheckoutState = { error?: string; refreshCatalog?: boolean };

const LANDING_CART = "/?cart=1";

/**
 * Turn the whole cookie cart into one server-priced order. There is no client
 * amount and no partial checkout: createOrder locks and validates every course
 * before writing any enrollment or order row.
 */
export async function checkout(
  _previous: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  void _previous;
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

  // Trình duyệt chỉ gửi email, không gửi số người và càng không gửi số tiền.
  // Nhóm được phân giải lại từ đầu ở đây; con số hiện trên giỏ hàng chỉ là báo
  // giá thử và không bao giờ là căn cứ của hóa đơn (BR-02).
  const normalized = normalizeMemberEmails(
    formData.getAll("thanhVien").map((value) => String(value)),
    session.user.email ?? "",
  );
  if (!normalized.ok) {
    return { error: normalized.message, refreshCatalog: false };
  }

  const { members, unregistered } = await resolveGroupMembers(normalized.emails);
  if (unregistered.length > 0) {
    return {
      error:
        `Chưa tìm thấy tài khoản đã xác thực cho: ${unregistered.join(", ")}. ` +
        "Mỗi bạn trong nhóm cần tự đăng ký và xác thực email trước khi nhóm trưởng thanh toán.",
      refreshCatalog: false,
    };
  }

  const ids = await readCartIds();
  // Trình duyệt gửi lên đúng một bit: "có muốn tiêu credits không". Số dư, số
  // tiền được trừ và tổng cuối cùng đều do server tự tính lại (BR-02).
  const useCredit = formData.get("duNgCredit") === "1";
  const result = await createOrder(session.user.id, ids, { members, useCredit });
  if (!result.ok) {
    return { error: result.message, refreshCatalog: true };
  }
  revalidateTag(COURSES_TAG, { expire: 0 });

  // Chốt giá: bảng giá hoặc số người có thể đổi giữa lúc giỏ hàng báo giá và
  // lúc đơn được ghi. Đơn đã tạo phải bị hủy chứ không để lại — nó đang giữ ghế
  // và sắp có một link PayOS với con số học viên chưa từng đồng ý.
  // Chỉ chốt khi form THỰC SỰ gửi con số. `Number(null)` là 0, nên đọc thẳng ra
  // số sẽ biến một field vắng mặt thành "khách kỳ vọng 0đ" và chặn mọi đơn.
  const raw = formData.get("tongTienDuKien");
  const expected = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : null;
  if (expected !== null && Number.isInteger(expected) && expected !== result.amountVnd) {
    await cancelOrder(result.orderId, { userId: session.user.id });
    return {
      error:
        "Số tiền vừa thay đổi so với lúc bạn xem giỏ hàng. Vui lòng kiểm tra lại rồi thanh toán.",
      refreshCatalog: true,
    };
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
