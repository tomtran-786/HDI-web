import { appUrl } from "./email";
import { prisma } from "./prisma";
import { isPayosNotFound, payosClient } from "./payos";
import { cancelOrder } from "./orders";

export type CheckoutLinkResult =
  | { ok: true; state: "ready"; checkoutUrl: string }
  | { ok: false; state: "closed" | "not_found"; message: string }
  | { ok: false; state: "pending_gateway"; message: string };

/** Create the external link only after the local, server-priced order exists. */
export async function ensurePayosCheckout(
  orderId: string,
  userId: string,
): Promise<CheckoutLinkResult> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    select: {
      id: true,
      code: true,
      status: true,
      amountVnd: true,
      expiresAt: true,
      checkoutUrl: true,
      user: { select: { name: true, email: true, phone: true } },
      items: {
        select: {
          priceVnd: true,
          cohort: { select: { courseSlug: true, ky: true } },
        },
      },
    },
  });
  if (!order) {
    return { ok: false, state: "not_found", message: "Không tìm thấy đơn hàng." };
  }
  if (order.status !== "pending" || order.expiresAt <= new Date()) {
    return {
      ok: false,
      state: "closed",
      message: "Đơn hàng không còn chờ thanh toán.",
    };
  }
  if (order.checkoutUrl) {
    return { ok: true, state: "ready", checkoutUrl: order.checkoutUrl };
  }

  const base = appUrl();
  try {
    const link = await payosClient().paymentRequests.create({
      orderCode: order.code,
      amount: order.amountVnd,
      description: `HDI ${order.code}`,
      cancelUrl: `${base}/thanh-toan/huy?orderCode=${order.code}`,
      returnUrl: `${base}/thanh-toan/ket-qua?orderCode=${order.code}`,
      expiredAt: Math.floor(order.expiresAt.getTime() / 1000),
      buyerName: order.user.name ?? undefined,
      buyerEmail: order.user.email,
      buyerPhone: order.user.phone ?? undefined,
      items: order.items.map((item) => ({
        name: `${item.cohort.courseSlug} ${item.cohort.ky}`.slice(0, 80),
        quantity: 1,
        price: item.priceVnd,
      })),
    });

    const saved = await prisma.order.updateMany({
      where: { id: order.id, userId, status: "pending" },
      data: {
        provider: "payos",
        providerRef: link.paymentLinkId,
        checkoutUrl: link.checkoutUrl,
      },
    });
    if (saved.count === 0) {
      return {
        ok: false,
        state: "closed",
        message: "Đơn hàng vừa được xử lý ở một yêu cầu khác.",
      };
    }
    return { ok: true, state: "ready", checkoutUrl: link.checkoutUrl };
  } catch (createError) {
    // The response may have been lost after PayOS created the link. Query by
    // collision-free order code before releasing seats or creating another.
    try {
      const remote = await payosClient().paymentRequests.get(order.code);
      await prisma.order.updateMany({
        where: { id: order.id, status: "pending" },
        data: { provider: "payos", providerRef: remote.id },
      });
      console.error(
        `[payos] Link #${order.code} tồn tại nhưng checkoutUrl không khôi phục được:`,
        createError,
      );
      return {
        ok: false,
        state: "pending_gateway",
        message:
          "PayOS đã nhận đơn nhưng chưa trả lại đường dẫn. Vui lòng mở lại đơn sau ít phút.",
      };
    } catch (lookupError) {
      if (isPayosNotFound(lookupError)) {
        await cancelOrder(order.id, { userId, as: "cancelled" });
        return {
          ok: false,
          state: "closed",
          message: "Chưa tạo được liên kết PayOS. Vui lòng thử đặt đơn lại.",
        };
      }
      console.error(`[payos] Không xác định được trạng thái link #${order.code}:`, lookupError);
      return {
        ok: false,
        state: "pending_gateway",
        message:
          "PayOS đang gián đoạn. Đơn vẫn được giữ an toàn; vui lòng mở lại sau.",
      };
    }
  }
}

