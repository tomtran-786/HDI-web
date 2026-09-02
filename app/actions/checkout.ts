"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { parseId } from "@/lib/action-input";
import { auth } from "@/lib/auth";
import { allowUserAction } from "@/lib/auth-throttle";
import { currentProfile } from "@/lib/current-profile";
import { isProfileComplete } from "@/lib/profile";
import { readCartIds, writeCartIds } from "@/lib/cart";
import { markCheckoutHandoff } from "@/lib/checkout-handoff";
import { prisma } from "@/lib/prisma";
import { normalizeMemberEmails, resolveGroupMembers } from "@/lib/group-members";
import { cancelOrder, createOrder } from "@/lib/orders";
import { ensurePayosCheckout } from "@/lib/payment-checkout";
import { COURSES_TAG } from "@/lib/cache-tags";

export type CheckoutState = {
  error?: string;
  refreshCatalog?: boolean;
  /** Mã đơn đang chờ đã chặn lần đặt này — giỏ hàng vẽ nó thành một liên kết. */
  pendingOrderCode?: number;
};

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
    return {
      error: result.message,
      refreshCatalog: true,
      pendingOrderCode: result.pendingOrderCode,
    };
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
    const rolledBack = await cancelOrder(result.orderId, { userId: session.user.id });
    // ĐỌC kết quả, không chỉ `await`. Khi hủy không thành — PayOS chập, hoặc
    // link đã nhận tiền — đơn vừa tạo vẫn đang giữ ghế, giữ credits và giữ suất
    // giảm giá "đơn đầu tiên" của chính người này. Bảo họ "kiểm tra lại giỏ
    // hàng" khi đó là chỉ sai đường: quay lại giỏ sẽ ra một con số khác nữa, vì
    // số dư credits đang bị chính đơn treo kia trừ mất. Trang đơn hàng mới là
    // nơi có nút hủy và nút thanh toán lại.
    // Giỏ hàng KHÔNG bị dọn ở nhánh này. Đơn treo có thể được hủy từ trang kia,
    // và khi đó người mua cần giỏ của mình còn nguyên để thử lại.
    if (!rolledBack.cancelled) redirect(`/tai-khoan/don-hang/${result.code}`);
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

  if (payment.ok) {
    // Đánh dấu TRƯỚC khi rời đi. Cookie chỉ đặt được từ một Server Function, và
    // sau `redirect` thì không còn Server Function nào chạy nữa — nên đây là cơ
    // hội duy nhất để ghi lại rằng trình duyệt này đang có một phiên thanh toán
    // treo dở. Xem app/api/thanh-toan/roi-trang/route.ts.
    await markCheckoutHandoff({ kind: "order", key: String(result.code) });
    redirect(payment.checkoutUrl);
  }
  redirect(`/tai-khoan/don-hang/${result.code}`);
}

/**
 * Dựng lại giỏ hàng từ một đơn đã đóng.
 *
 * Đường phục hồi cho việc tự hủy: giỏ hàng bị dọn ngay lúc bàn giao sang PayOS,
 * nên một đơn bị thu hồi — dù đúng ý người dùng hay do họ chỉ mở tab thứ hai —
 * để lại một giỏ trống và không có cách nào lấy lại lựa chọn cũ ngoài việc bấm
 * lại từ đầu. Một cú bấm đưa mọi thứ về chỗ cũ.
 *
 * CHỈ nhận đơn đã đóng của CHÍNH người đang đăng nhập. Đơn `pending` bị loại
 * không phải vì bảo mật mà vì đúng đắn: ghế của nó vẫn đang được giữ, và đổ nó
 * vào giỏ sẽ dẫn thẳng tới một lần checkout bị `already_enrolled` từ chối.
 */
export async function restoreCartFromOrder(orderId: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const };

  const id = parseId(orderId);
  if (!id) return { ok: false as const };

  const order = await prisma.order.findFirst({
    where: {
      id,
      userId: session.user.id,
      status: { in: ["cancelled", "expired"] },
    },
    select: { items: { select: { courseId: true } } },
  });
  if (!order) return { ok: false as const };

  // Đơn nhóm có nhiều dòng cho cùng một khóa, mỗi dòng một ghế. Giỏ hàng là một
  // TẬP khóa, không phải danh sách ghế — số người được gõ lại ở ô mời nhóm.
  const ids = [...new Set(order.items.map((item) => item.courseId))];
  await writeCartIds(ids);
  return { ok: true as const, count: ids.length };
}
