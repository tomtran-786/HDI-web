import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { allowUserAction } from "@/lib/auth-throttle";
import { clearCheckoutHandoff } from "@/lib/checkout-handoff";
import { syncPayosOrderStatus } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import {
  findServiceOrder,
  serviceOrderView,
  syncPayosServiceOrderStatus,
} from "@/lib/service-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };

/**
 * Trạng thái hiện tại của MỘT đơn, cho <PaymentPoll /> hỏi lại trong lúc chờ
 * webhook PayOS.
 *
 * Lý do endpoint này tồn tại: trước đây PaymentPoll gọi `router.refresh()` mỗi
 * 4 giây, tám lần. Mỗi lần là một lượt render RSC ĐẦY ĐỦ — chạy lại root layout
 * (kể cả `auth()`) rồi mới tới truy vấn đơn — nên một lượt thanh toán tốn mười
 * sáu lần render, đúng vào lúc `createOrder` đang giữ FOR UPDATE trên bảng
 * courses. Ở đây chỉ đọc đúng một dòng, và trang chỉ render lại khi trạng thái
 * thật sự đổi.
 *
 * Trả về CHUỖI trạng thái chứ không phải boolean "đã xong chưa": đơn còn đi từ
 * pending sang hết hạn theo thời gian mà không đổi cột `status` nào, và trang
 * kết quả dịch vụ có hiển thị riêng cho trường hợp đó.
 */
/**
 * Trần cho lượt hỏi PayOS mà endpoint này sinh ra.
 *
 * Không có nó, một tab bị bỏ quên trên trang kết quả là một lượt gọi PayOS mỗi
 * bốn giây, vô hạn — hạn ngạch của HDI chứ không phải của người dùng. Trần 60
 * lượt/giờ đủ rộng cho vài lần thanh toán liên tiếp (mỗi lần là 8 vòng poll) và
 * vẫn là một trần.
 *
 * Chạm trần KHÔNG phải là lỗi: endpoint chỉ lùi về đọc trạng thái trong database,
 * đúng hành vi trước khi có phần đồng bộ này.
 */
function allowSync(userId: string) {
  return allowUserAction("payos_sync", userId, 60);
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "auth_required" },
      { status: 401, headers: noStore },
    );
  }

  const params = new URL(request.url).searchParams;
  const donHang = params.get("donHang");
  const dichVu = params.get("dichVu");

  if (dichVu) {
    // `findServiceOrder` mang userId TRONG `where`, nên ref của người khác trả
    // về null chứ không phải trạng thái của họ.
    let order = await findServiceOrder(dichVu, session.user.id);
    if (!order) {
      return NextResponse.json(
        { error: "not_found" },
        { status: 404, headers: noStore },
      );
    }
    if (order.status === "pending" && (await allowSync(session.user.id))) {
      const synced = await syncPayosServiceOrderStatus(order.id, {
        userId: session.user.id,
      });
      if (synced.closed) order = { ...order, status: synced.as };
    }
    if (order.status !== "pending") await clearCheckoutHandoff();
    // `cancelledCheckout` là một cờ trên URL của trình duyệt, không phải trạng
    // thái server. Trang truyền `banDau` đã tính với cùng tham số `false` này,
    // nên hai bên so được với nhau.
    return NextResponse.json(
      { trangThai: serviceOrderView(order, new Date(), false) },
      { headers: noStore },
    );
  }

  const code = Number(donHang);
  if (!Number.isInteger(code)) {
    return NextResponse.json(
      { error: "bad_request" },
      { status: 400, headers: noStore },
    );
  }

  const order = await prisma.order.findFirst({
    where: { code, userId: session.user.id },
    select: { id: true, status: true },
  });
  if (!order) {
    return NextResponse.json(
      { error: "not_found" },
      { status: 404, headers: noStore },
    );
  }
  if (order.status === "pending" && (await allowSync(session.user.id))) {
    const synced = await syncPayosOrderStatus(order.id, { userId: session.user.id });
    if (synced.closed) {
      await clearCheckoutHandoff();
      return NextResponse.json({ trangThai: synced.as }, { headers: noStore });
    }
  }
  // Đơn đã chốt thì phiên thanh toán không còn gì để thu hồi. Xóa dấu ở ĐÂY,
  // trong một Route Handler, là cách duy nhất làm được điều đó cho đường trả
  // tiền thành công: `/thanh-toan/ket-qua` là một page render nên nó không đặt
  // hay xóa được cookie, và PaymentPoll gọi vào endpoint này ngay trên đó.
  if (order.status !== "pending") await clearCheckoutHandoff();
  return NextResponse.json({ trangThai: order.status }, { headers: noStore });
}
