"use server";

import { redirect } from "next/navigation";
import { consumeAuthLimit, serverActionIp } from "@/lib/auth-throttle";
import { createServiceOrder, ensureServiceCheckout } from "@/lib/service-orders";

export type QuoteState = { error?: string };

/**
 * Tạo đơn dịch vụ rồi đưa học viên sang trang thanh toán của PayOS.
 *
 * Action này KHÔNG yêu cầu đăng nhập — dịch vụ 35K không đáng để bắt ai lập tài
 * khoản. Cái giá của quyết định đó là mỗi lần bấm đều tạo một payment link thật
 * ở PayOS, tức tiêu hạn ngạch thật của HDI, và không có danh tính nào để đếm
 * theo. Vậy nên bộ đếm theo IP ở đây không phải phòng xa mà là thứ duy nhất
 * đứng giữa một vòng lặp và tài khoản merchant.
 *
 * `wordCount` và `kind` là hai giá trị duy nhất đến từ trình duyệt; số tiền do
 * `createServiceOrder` tra lại từ bảng giá.
 */
export async function startServiceCheckout(
  _previous: QuoteState,
  formData: FormData,
): Promise<QuoteState> {
  const ip = await serverActionIp();
  if (
    !(await consumeAuthLimit({
      action: "service_quote",
      key: `ip:${ip}`,
      limit: 10,
      windowMs: 60 * 60 * 1000,
    }))
  ) {
    return {
      error: "Bạn vừa tạo quá nhiều đơn. Vui lòng thử lại sau ít phút.",
    };
  }

  // `Number("")` là 0 và `Number(null)` cũng là 0; cả hai đều trượt guard số
  // nguyên dương trong createServiceOrder, nên không cần nhánh riêng ở đây.
  const wordCount = Number(formData.get("wordCount"));
  const kind = formData.get("kind");

  const order = await createServiceOrder({ kind, wordCount });
  if (!order.ok) return { error: order.message };

  const checkout = await ensureServiceCheckout(order.ref);
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
