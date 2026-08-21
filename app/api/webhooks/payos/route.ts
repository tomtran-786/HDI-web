import { NextResponse } from "next/server";
import { processPayosPayment } from "@/lib/orders";
import { PayosConfigurationError, verifyPayosWebhook } from "@/lib/payos";
import { fulfillOrderDrive } from "@/lib/fulfillment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  try {
    const result = await processPayosPayment({
      orderCode: data.orderCode,
      amount: data.amount,
      currency: data.currency,
      reference: data.reference,
      paymentLinkId: data.paymentLinkId,
      transactionDateTime: data.transactionDateTime,
      code: data.code,
      payload,
    });

    if (result.outcome === "requires_review" || result.outcome === "reference_conflict") {
      console.error("[payos-webhook] Thanh toán cần kiểm tra thủ công:", result);
    }
    if ("fulfill" in result && result.fulfill && result.orderId) {
      await fulfillOrderDrive(result.orderId).catch((error) =>
        console.error(`[payos-webhook] Đơn ${result.orderId} đã paid nhưng Drive lỗi:`, error),
      );
    }

    // PayOS treats every 2xx as acknowledged. Business mismatches are persisted
    // for review; only infrastructure exceptions below ask it to retry.
    return NextResponse.json({ ok: true, outcome: result.outcome });
  } catch (error) {
    console.error("[payos-webhook] Không xử lý được giao dịch:", error);
    return NextResponse.json({ ok: false, error: "processing_failed" }, { status: 500 });
  }
}
