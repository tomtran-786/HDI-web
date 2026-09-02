import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { allowUserAction } from "@/lib/auth-throttle";
import { clearCheckoutHandoff, readCheckoutHandoff } from "@/lib/checkout-handoff";
import { cancelOrder } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { cancelServiceOrder } from "@/lib/service-orders";
import { revalidateTag } from "next/cache";
import { COURSES_TAG } from "@/lib/cache-tags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };

/**
 * Thu hồi một phiên thanh toán bị bỏ dở.
 *
 * PayOS chỉ gọi về `cancelUrl` khi học viên bấm đúng nút "Hủy". Đóng tab, bấm
 * Back, hay để app ngân hàng nuốt mất deep link đều không sinh tín hiệu nào, và
 * trước đây đơn cứ thế giữ ghế, giữ credits và giữ suất giảm giá "đơn đầu tiên"
 * của chính người mua cho tới lượt cron 03:00 hôm sau. Endpoint này là tín hiệu
 * còn thiếu: `<CheckoutReclaim />` gọi vào đây ngay khi học viên xuất hiện lại
 * trên site với dấu bàn giao còn trên trình duyệt.
 *
 * BA LỚP CHẶN CHO VIỆC HỦY NHẦM, vì hủy là một hành động không lấy lại được:
 *
 *  1. `cancelOrder` hỏi PayOS TRƯỚC và từ chối mọi trạng thái có tiền, nên một
 *     khoản đang chuyển không bao giờ bị phá dù người dùng có mở bao nhiêu tab.
 *  2. `<CheckoutReclaim />` không gọi vào đây từ `/thanh-toan/ket-qua` — trang
 *     đó nghĩa là học viên vừa trả tiền xong.
 *  3. Cookie bị xóa dù kết quả ra sao, nên mỗi lần bàn giao chỉ thu hồi một lần.
 *
 * `userId` đi vào `where` chứ không được kiểm sau khi đọc: giá trị trong cookie
 * do trình duyệt nắm, nên nó chỉ được dùng để TÌM đơn của chính người đang đăng
 * nhập, không bao giờ để chứng minh quyền sở hữu.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "auth_required" }, { status: 401, headers: noStore });
  }

  const handoff = await readCheckoutHandoff();
  if (!handoff) {
    return NextResponse.json({ huy: false }, { headers: noStore });
  }

  // Mỗi lượt thu hồi là tối đa hai lượt gọi sang PayOS. Trần rộng hơn nút hủy
  // thủ công (10) vì endpoint này chạy tự động, nhưng vẫn là một trần: một
  // client hỏng lặp vô hạn không được phép tiêu hết hạn ngạch PayOS của HDI.
  if (!(await allowUserAction("checkout_reclaim", session.user.id, 30))) {
    return NextResponse.json({ huy: false, lyDo: "throttled" }, { headers: noStore });
  }

  const userId = session.user.id;
  // Xóa dấu TRƯỚC khi gọi PayOS. Lượt gọi kia mất tới ~20 giây, và một học viên
  // sốt ruột bấm qua ba trang trong lúc đó sẽ tạo ra ba lượt hủy chồng nhau cho
  // cùng một đơn. Đơn không mất đi đâu nếu lượt này hỏng: `syncPayosOrderStatus`
  // trên trang đơn hàng và cron hằng ngày vẫn là lưới phía sau.
  await clearCheckoutHandoff();

  if (handoff.kind === "service") {
    const order = await prisma.serviceOrder.findFirst({
      where: { ref: handoff.key, userId, status: "pending" },
      select: { id: true, code: true },
    });
    if (!order) return NextResponse.json({ huy: false }, { headers: noStore });

    const result = await cancelServiceOrder(order.id, { userId });
    return NextResponse.json(
      { huy: result.cancelled, loai: "service", code: order.code, lyDo: result.cancelled ? undefined : result.reason },
      { headers: noStore },
    );
  }

  const order = await prisma.order.findFirst({
    where: { code: Number(handoff.key), userId, status: "pending" },
    select: { id: true, code: true },
  });
  if (!order) return NextResponse.json({ huy: false }, { headers: noStore });

  const result = await cancelOrder(order.id, { userId });
  // Ghế vừa được trả phải hiện lại trên trang khóa học. Đây là Route Handler nên
  // `revalidateTag` dùng được ở đây — khác với `/thanh-toan/huy`, nơi việc hủy
  // xảy ra lúc render page và bộ đếm ghế phải chờ hết 300 giây cache.
  if (result.cancelled) revalidateTag(COURSES_TAG, { expire: 0 });

  return NextResponse.json(
    {
      huy: result.cancelled,
      loai: "order",
      code: order.code,
      orderId: result.cancelled ? order.id : undefined,
      lyDo: result.cancelled ? undefined : result.reason,
    },
    { headers: noStore },
  );
}
