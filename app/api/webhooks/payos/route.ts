import { NextResponse } from "next/server";
import { processPayosPayment, type PayosPaymentEvent } from "@/lib/orders";
import { PayosConfigurationError, verifyPayosWebhook } from "@/lib/payos";
import { processServicePayment } from "@/lib/service-orders";
import { fulfillOrderDrive, notifyGroupMembers } from "@/lib/fulfillment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/**
 * Sau khi commit thanh toán, handler còn cấp quyền Google Drive cho từng ghế rồi
 * gửi thư cho từng thành viên. Một nhóm mười người mua nhiều khóa là hàng chục
 * lượt gọi ra ngoài mạng, và mặc định của Vercel không đủ cho chúng. Hết giờ ở
 * đây không mất tiền — lượt giao lại của PayOS chạy lại phần giao hàng — nhưng
 * nó biến một lần thanh toán thành một lần chờ, nên cứ cho đủ giờ ngay từ đầu.
 */
export const maxDuration = 60;

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  let data: Awaited<ReturnType<typeof verifyPayosWebhook>>;
  try {
    data = await verifyPayosWebhook(payload);
  } catch (error) {
    if (error instanceof PayosConfigurationError) {
      console.error("[payos-webhook] Chưa cấu hình PayOS:", error.message);
      return NextResponse.json(
        { ok: false, error: "gateway_not_configured" },
        { status: 500 },
      );
    }
    console.warn("[payos-webhook] Chữ ký không hợp lệ:", error);
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 400 });
  }

  const event: PayosPaymentEvent = {
    orderCode: data.orderCode,
    amount: data.amount,
    currency: data.currency,
    reference: data.reference,
    paymentLinkId: data.paymentLinkId,
    transactionDateTime: data.transactionDateTime,
    code: data.code,
    payload,
  };

  try {
    const result = await processPayosPayment(event);

    // Mã không nằm trong `orders` thì thử `service_orders` — cùng một cổng
    // PayOS phục vụ hai loại đơn. Rẽ nhánh bằng KẾT QUẢ TRA CỨU chứ không bằng
    // dải số: dải mã (100001 với 900000001) là một quy ước của migration, và
    // một quy ước thì sửa được ở nơi khác mà webhook không hay biết.
    if (result.outcome === "unknown_order") {
      const service = await processServicePayment(event);
      if (service.outcome === "unknown_order") {
        console.warn(
          `[payos-webhook] Mã ${event.orderCode} không thuộc đơn hàng hay đơn dịch vụ nào.`,
        );
      } else if (
        service.outcome === "requires_review" ||
        service.outcome === "reference_conflict"
      ) {
        console.error("[payos-webhook] Đơn dịch vụ cần kiểm tra thủ công:", service);
      }
      return NextResponse.json({
        ok: true,
        scope: "service",
        outcome: service.outcome,
      });
    }

    if (result.outcome === "requires_review" || result.outcome === "reference_conflict") {
      console.error("[payos-webhook] Thanh toán cần kiểm tra thủ công:", result);
    }
    if ("fulfill" in result && result.fulfill && result.orderId) {
      const orderId = result.orderId;
      await fulfillOrderDrive(orderId).catch((error) =>
        console.error(`[payos-webhook] Đơn ${orderId} đã paid nhưng Drive lỗi:`, error),
      );
      // Sau khi cấp quyền, vì thư báo với thành viên rằng quyền đã sẵn sàng.
      // `await` chứ không bắn-rồi-quên: trên serverless, lambda bị đóng băng
      // ngay khi handler trả về và thư chưa gửi xong sẽ biến mất.
      await notifyGroupMembers(orderId).catch((error) =>
        console.error(`[payos-webhook] Đơn ${orderId} không báo được cho thành viên:`, error),
      );
    }

    // PayOS treats every 2xx as acknowledged. Business mismatches are persisted
    // for review; only infrastructure exceptions below ask it to retry.
    return NextResponse.json({ ok: true, scope: "order", outcome: result.outcome });
  } catch (error) {
    console.error("[payos-webhook] Không xử lý được giao dịch:", error);
    return NextResponse.json({ ok: false, error: "processing_failed" }, { status: 500 });
  }
}
