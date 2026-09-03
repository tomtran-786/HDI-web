import { runOrderFulfillment } from "./fulfillment";
import { ORDER_LATE_GRACE_MINUTES, reclaimPaidPayosOrder } from "./orders";
import { notifyPaymentReview } from "./payment-review";
import { prisma } from "./prisma";
import { reclaimPaidPayosServiceOrder } from "./service-orders";

/**
 * Đối soát-kéo theo lô, cho cron hằng ngày chạy.
 *
 * Đây là lưới đỡ 24 giờ cho trường hợp PayOS không gửi webhook (URL chưa đăng
 * ký, bị PayOS tự tắt sau nhiều lần lỗi, …). Đường tự chữa CHÍNH là poller
 * `/api/trang-thai-don` — người mua ngồi ở trang kết quả gọi lại mỗi vài giây.
 * File này gom cả hai loại đơn cùng một khuôn budget để module `lib/orders.ts`
 * không phải kéo theo `lib/fulfillment.ts` (googleapis, Resend).
 */

/**
 * Nới thêm sau `expiresAt` khi quét: một khoản tiền về muộn trong khoảng ân hạn
 * vẫn cứu được, nên đơn vừa quá hạn phải được hỏi PayOS TRƯỚC khi
 * `expireStaleOrders` đóng nó.
 */
const RECONCILE_GRACE_MS = ORDER_LATE_GRACE_MINUTES * 60_000;

/** Đơn từng chạm tới PayOS: một trong hai cột này khác null. */
const HAS_REMOTE_LINK = [
  { providerRef: { not: null } },
  { checkoutUrl: { not: null } },
];

/**
 * Hỏi PayOS về các đơn khóa học `pending` sắp/vừa quá hạn còn mang link, và xác
 * nhận đơn nào đã PAID. Mỗi đơn tự bọc `try/catch` — một PayOS timeout không
 * được làm hỏng cả lượt cron. Dừng khi hết ngân sách thời gian.
 */
export async function reconcilePaidPayosOrders(
  now = new Date(),
  budgetMs = 15_000,
): Promise<{ scanned: number; confirmed: number; review: number }> {
  const candidates = await prisma.order.findMany({
    where: {
      status: "pending",
      provider: "payos",
      expiresAt: { lt: new Date(now.getTime() + RECONCILE_GRACE_MS) },
      OR: HAS_REMOTE_LINK,
    },
    select: { id: true },
    orderBy: { expiresAt: "asc" },
    take: 30,
  });

  const deadline = Date.now() + budgetMs;
  let confirmed = 0;
  let review = 0;
  let scanned = 0;
  for (const order of candidates) {
    if (Date.now() >= deadline) break;
    scanned += 1;
    try {
      const result = await reclaimPaidPayosOrder(order.id);
      if (!result.confirmed) continue;
      if (result.outcome === "succeeded") {
        confirmed += 1;
        if (result.fulfill) await runOrderFulfillment(result.orderId);
      }
      if (result.review) {
        review += 1;
        await notifyPaymentReview(result.review);
      }
    } catch (error) {
      console.error(`[reconcile] Đơn ${order.id} đối soát PAID hỏng:`, error);
    }
  }
  return { scanned, confirmed, review };
}

/** Bản đơn dịch vụ: không có bước giao hàng, chỉ chuyển `review` đi báo động. */
export async function reconcilePaidPayosServiceOrders(
  now = new Date(),
  budgetMs = 8_000,
): Promise<{ scanned: number; confirmed: number; review: number }> {
  const candidates = await prisma.serviceOrder.findMany({
    where: {
      status: "pending",
      provider: "payos",
      expiresAt: { lt: new Date(now.getTime() + RECONCILE_GRACE_MS) },
      OR: HAS_REMOTE_LINK,
    },
    select: { id: true },
    orderBy: { expiresAt: "asc" },
    take: 30,
  });

  const deadline = Date.now() + budgetMs;
  let confirmed = 0;
  let review = 0;
  let scanned = 0;
  for (const order of candidates) {
    if (Date.now() >= deadline) break;
    scanned += 1;
    try {
      const result = await reclaimPaidPayosServiceOrder(order.id);
      if (!result.confirmed) continue;
      if (result.outcome === "succeeded") confirmed += 1;
      if (result.review) {
        review += 1;
        await notifyPaymentReview(result.review);
      }
    } catch (error) {
      console.error(
        `[reconcile] Đơn dịch vụ ${order.id} đối soát PAID hỏng:`,
        error,
      );
    }
  }
  return { scanned, confirmed, review };
}

/**
 * Tín hiệu "webhook PayOS có thể đã chết".
 *
 * Báo động khi dòng `payments` mới nhất cũ hơn `stalenessHours` giờ VÀ vẫn còn
 * đơn `pending` mang link PayOS cũ hơn một giờ — đúng hình trạng của sự cố
 * 100032 / 100039: tiền vào tài khoản, đơn treo, không một lá thư. Gọi trong
 * cron SAU bước đối soát, để không báo động vì chính lượt đối soát vừa dọn xong.
 */
export async function checkPayosWebhookHealth(
  now = new Date(),
  stalenessHours = 12,
): Promise<{
  healthy: boolean;
  lastPaymentAt: Date | null;
  pendingWithLink: number;
}> {
  const [latest, pendingWithLink] = await Promise.all([
    prisma.payment.findFirst({
      orderBy: { receivedAt: "desc" },
      select: { receivedAt: true },
    }),
    prisma.order.count({
      where: {
        status: "pending",
        provider: "payos",
        createdAt: { lt: new Date(now.getTime() - 3_600_000) },
        OR: HAS_REMOTE_LINK,
      },
    }),
  ]);

  const lastPaymentAt = latest?.receivedAt ?? null;
  const stale =
    lastPaymentAt === null ||
    now.getTime() - lastPaymentAt.getTime() > stalenessHours * 3_600_000;
  const healthy = !(stale && pendingWithLink > 0);

  if (!healthy) {
    console.error(
      `[payos-health] Webhook nghi ngừng: payments mới nhất ${
        lastPaymentAt?.toISOString() ?? "chưa từng có"
      }, ${pendingWithLink} đơn pending còn giữ link.`,
    );
    await notifyPaymentReview({
      label: "Webhook PayOS",
      reason: `Không có giao dịch nào ${stalenessHours} giờ qua nhưng ${pendingWithLink} đơn vẫn chờ thanh toán — kiểm tra đăng ký webhook`,
      expectedVnd: null,
      receivedVnd: 0,
      providerRef: "webhook-health-check",
    });
  }

  return { healthy, lastPaymentAt, pendingWithLink };
}
