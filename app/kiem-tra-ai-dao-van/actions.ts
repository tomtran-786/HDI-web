"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { allowUserAction } from "@/lib/auth-throttle";
import { createServiceOrder, ensureServiceCheckout } from "@/lib/service-orders";

export type QuoteState = { error?: string };

/** Nơi quay lại sau khi đăng nhập — trang báo giá, không phải trang chủ. */
const QUOTE_PAGE = "/kiem-tra-ai-dao-van";

/**
 * Tạo đơn dịch vụ rồi đưa học viên sang trang thanh toán của PayOS.
 *
 * Bắt đăng nhập, giống hệt luồng mua khóa học: mọi thứ có thu tiền trên trang
 * này đều thuộc về một tài khoản. Ngoài việc học viên tìm lại được đơn trong
 * trang tài khoản, nó còn cho `allowUserAction` một danh tính để đếm — mỗi lần
 * bấm là một payment link thật ở PayOS, tức hạn ngạch thật của HDI.
 *
 * `auth()` gọi ở đây chứ không chỉ ở trang render form: một Server Action là
 * endpoint POST riêng, ai cũng gọi được nếu biết action id.
 *
 * `wordCount` và `kind` là hai giá trị duy nhất đến từ trình duyệt; số tiền do
 * `createServiceOrder` tra lại từ bảng giá.
 */
export async function startServiceCheckout(
  _previous: QuoteState,
  formData: FormData,
): Promise<QuoteState> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/dang-nhap?tiep=${encodeURIComponent(QUOTE_PAGE)}`);
  }

  if (!(await allowUserAction("service_quote", session.user.id, 10))) {
    return {
      error: "Bạn vừa tạo quá nhiều đơn. Vui lòng thử lại sau ít phút.",
    };
  }

  // `Number("")` là 0 và `Number(null)` cũng là 0; cả hai đều trượt guard số
  // nguyên dương trong createServiceOrder, nên không cần nhánh riêng ở đây.
  const wordCount = Number(formData.get("wordCount"));
  const kind = formData.get("kind");

  const order = await createServiceOrder({
    userId: session.user.id,
    kind,
    wordCount,
  });
  if (!order.ok) return { error: order.message };

  const checkout = await ensureServiceCheckout(order.ref, session.user.id);
  if (!checkout.ok) {
    // Đơn đã nằm trong database rồi, nên vẫn đưa học viên tới trang kết quả:
    // ở đó có mã đơn và nút mở lại thanh toán, thay vì một thông báo lỗi cụt.
    if (checkout.state === "pending_gateway") {
      redirect(`/kiem-tra-ai-dao-van/ket-qua/${order.ref}`);
    }
    return { error: checkout.message };
  }

  redirect(checkout.checkoutUrl);
}
