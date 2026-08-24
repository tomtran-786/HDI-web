import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findServiceOrder, serviceOrderView } from "@/lib/service-orders";

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
    const order = await findServiceOrder(dichVu, session.user.id);
    if (!order) {
      return NextResponse.json(
        { error: "not_found" },
        { status: 404, headers: noStore },
      );
    }
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
    select: { status: true },
  });
  if (!order) {
    return NextResponse.json(
      { error: "not_found" },
      { status: 404, headers: noStore },
    );
  }
  return NextResponse.json({ trangThai: order.status }, { headers: noStore });
}
