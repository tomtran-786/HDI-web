import { randomBytes } from "node:crypto";
import { appUrl } from "./app-url";
import { isAiCheckKind, isValidWordCount, quote } from "./ai-check-pricing";
import {
  classifyPayosPayment,
  PAYOS_DEAD_STATES,
  PAYOS_MONEY_STATES,
  payosPaymentLinkMatches,
  payosReviewReason,
  payosTransactionTime,
  type PaymentReview,
  type PayosPaymentEvent,
} from "./orders";
import { isPayosNotFound, payosClient } from "./payos";
import { PAYMENT_TX } from "./db-budget";
import { prisma } from "./prisma";

/**
 * Đơn dịch vụ kiểm tra AI/đạo văn.
 *
 * Bản song song của lib/orders.ts cho một luồng đơn giản hơn hẳn: không tài
 * khoản, không giỏ hàng, không chỗ ngồi nào bị giữ. Cái được giữ lại nguyên vẹn
 * từ luồng khóa học là phần khó: giá luôn do server tính, và mọi kết luận về
 * một sự kiện PayOS đều đi qua `classifyPayosPayment` chung — có đúng một định
 * nghĩa thế nào là "đã trả tiền" trong toàn bộ mã nguồn này.
 */

/**
 * Đơn dịch vụ sống 24 giờ, dài hơn hẳn 2 giờ của đơn khóa học.
 *
 * Không phải sự thiếu nhất quán: 2 giờ của đơn khóa học là thời hạn GIỮ CHỖ, và
 * nó ngắn vì mỗi phút trôi qua là một chỗ ngồi bị treo khỏi tay người khác. Đơn
 * dịch vụ không giữ tài nguyên của ai; hết hạn ở đây chỉ là dọn dẹp, nên thời
 * hạn được chọn theo sự thuận tiện của học viên chứ không theo sức ép nào.
 */
export const SERVICE_ORDER_TTL_HOURS = 24;

export type ServiceOrderView =
  | "paid"
  | "cancelled"
  | "cancelled_checkout"
  | "open"
  | "closed";

/**
 * Trang kết quả nhìn một đơn dịch vụ ở đúng một trong bốn trạng thái.
 *
 * Tách khỏi JSX vì trước đây title, subtitle và nút poll mỗi thứ tự suy ra
 * trạng thái bằng một chuỗi ternary riêng — và chúng đã lệch nhau: một đơn
 * `pending` đã quá hạn hiện tiêu đề "đã đóng" kèm dòng "đang chờ PayOS xác nhận".
 */
export function serviceOrderView(
  order: { status: string; expiresAt: Date },
  now: Date,
  cancelledCheckout: boolean,
): ServiceOrderView {
  if (order.status === "paid") return "paid";
  // `cancelled` tách khỏi `closed` từ khi luồng dịch vụ hủy đơn thật. Gộp lại
  // thì một đơn vừa được hủy theo yêu cầu sẽ đọc là "quá hạn hoặc đã hủy" — một
  // câu nói chung cho hai chuyện khác nhau, ngay lúc người dùng cần xác nhận
  // rằng thao tác vừa rồi đã có tác dụng.
  if (order.status === "cancelled") return "cancelled";
  const open = order.status === "pending" && order.expiresAt > now;
  if (!open) return "closed";
  return cancelledCheckout ? "cancelled_checkout" : "open";
}

export type ServiceOrderResult =
  | { ok: true; ref: string; code: number; amountVnd: number }
  | {
      ok: false;
      reason: "invalid_words" | "invalid_kind" | "too_long";
      message: string;
    };

type RefuseReason = "invalid_words" | "invalid_kind" | "too_long";

const refuseMessage: Record<RefuseReason, string> = {
  invalid_words: "Số từ phải là một số nguyên lớn hơn 0.",
  invalid_kind: "Vui lòng chọn một dịch vụ trong danh sách.",
  too_long:
    "Bản thảo dài hơn bảng giá. Vui lòng nhắn Zalo để được báo giá riêng.",
};

function refuse(reason: RefuseReason): ServiceOrderResult {
  return { ok: false, reason, message: refuseMessage[reason] };
}

/**
 * Tạo một đơn dịch vụ đã được server định giá.
 *
 * `wordCount` và `kind` là thứ DUY NHẤT đến từ trình duyệt. Số tiền không nằm
 * trong tham số và không thể nằm trong tham số: nó được `quote()` tra ra từ
 * bảng giá ngay tại đây, cùng một hàm mà trang đã dùng để hiển thị. `userId`
 * đến từ phiên đăng nhập ở phía server, không bao giờ từ form.
 */
export async function createServiceOrder(input: {
  userId: string;
  kind: unknown;
  wordCount: unknown;
}): Promise<ServiceOrderResult> {
  // Hai guard chạy TRƯỚC `quote()` dù `quote()` cũng kiểm đúng hai điều kiện
  // đó. Lý do là kiểu: sau hai dòng này TypeScript mới biết `input.wordCount`
  // là `number` và `input.kind` là `AiCheckKind`, nên không chỗ nào bên dưới
  // phải ép kiểu một giá trị đến từ payload của trình duyệt.
  if (!isValidWordCount(input.wordCount)) return refuse("invalid_words");
  if (!isAiCheckKind(input.kind)) return refuse("invalid_kind");

  const priced = quote(input.wordCount, input.kind);
  if (!priced.ok) return refuse(priced.reason);

  const expiresAt = new Date(
    Date.now() + SERVICE_ORDER_TTL_HOURS * 3600 * 1000,
  );
  const order = await prisma.serviceOrder.create({
    data: {
      // 16 byte ngẫu nhiên. `code` tuần tự là số đi vào nội dung chuyển khoản
      // nên nó phải ngắn và đoán được; `ref` là thứ đi vào URL trang kết quả
      // nên nó phải là thứ không đoán được.
      userId: input.userId,
      ref: randomBytes(16).toString("hex"),
      kind: input.kind,
      wordCount: input.wordCount,
      tier: priced.tier,
      amountVnd: priced.amountVnd,
      expiresAt,
      provider: "payos",
    },
    select: { ref: true, code: true, amountVnd: true },
  });

  return {
    ok: true,
    ref: order.ref,
    code: order.code,
    amountVnd: order.amountVnd,
  };
}

export type ServiceCheckoutResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; state: "closed" | "not_found" | "pending_gateway"; message: string };

/**
 * Tạo link thanh toán PayOS cho một đơn dịch vụ, hoặc trả lại link đã có.
 *
 * Giống `ensurePayosCheckout`, kể cả ở phần xử lý lỗi tưởng như thừa: khi
 * `create` ném lỗi, phản hồi của PayOS có thể đã mất trên đường về SAU KHI link
 * được tạo. Hỏi lại theo `orderCode` — con số duy nhất toàn cục — trước khi
 * đóng đơn, vì đóng nhầm một đơn đã có link là mở đường cho một link thứ hai
 * cùng số tiền.
 */
export async function ensureServiceCheckout(
  ref: string,
  userId: string,
): Promise<ServiceCheckoutResult> {
  // `userId` trong `where`, không phải kiểm sau khi đọc: một action là endpoint
  // POST riêng, và `ref` của người khác không được phép tạo ra link thanh toán
  // dù người gọi có đăng nhập hợp lệ.
  const order = await prisma.serviceOrder.findFirst({
    where: { ref, userId },
    select: {
      id: true,
      code: true,
      status: true,
      amountVnd: true,
      expiresAt: true,
      checkoutUrl: true,
      kind: true,
      user: { select: { name: true, email: true, phone: true } },
    },
  });
  if (!order) {
    return { ok: false, state: "not_found", message: "Không tìm thấy đơn dịch vụ." };
  }
  if (order.status !== "pending" || order.expiresAt <= new Date()) {
    return { ok: false, state: "closed", message: "Đơn này không còn chờ thanh toán." };
  }
  if (order.checkoutUrl) {
    return { ok: true, checkoutUrl: order.checkoutUrl };
  }

  const base = appUrl();
  const back = `${base}/kiem-tra-ai-dao-van/ket-qua/${ref}`;
  try {
    const link = await payosClient().paymentRequests.create({
      orderCode: order.code,
      amount: order.amountVnd,
      // PayOS cắt phần mô tả rất ngắn; tiền tố "AI" là thứ phân biệt đơn dịch
      // vụ với đơn khóa học ("HDI <code>") khi đọc sao kê ngân hàng.
      description: `HDI AI ${order.code}`,
      cancelUrl: `${back}?huy=1`,
      returnUrl: back,
      expiredAt: Math.floor(order.expiresAt.getTime() / 1000),
      buyerName: order.user.name ?? undefined,
      buyerEmail: order.user.email,
      buyerPhone: order.user.phone ?? undefined,
    });

    const saved = await prisma.serviceOrder.updateMany({
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
        message: "Đơn vừa được xử lý ở một yêu cầu khác.",
      };
    }
    return { ok: true, checkoutUrl: link.checkoutUrl };
  } catch (createError) {
    try {
      const remote = await payosClient().paymentRequests.get(order.code);
      await prisma.serviceOrder.updateMany({
        where: { id: order.id, status: "pending" },
        data: { provider: "payos", providerRef: remote.id },
      });
      console.error(
        `[payos] Link dịch vụ #${order.code} tồn tại nhưng checkoutUrl không khôi phục được:`,
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
        await prisma.serviceOrder.updateMany({
          where: { id: order.id, status: "pending" },
          data: { status: "cancelled", closedAt: new Date() },
        });
        return {
          ok: false,
          state: "closed",
          message: "Chưa tạo được liên kết PayOS. Vui lòng tạo lại đơn.",
        };
      }
      console.error(
        `[payos] Không xác định được trạng thái link dịch vụ #${order.code}:`,
        lookupError,
      );
      return {
        ok: false,
        state: "pending_gateway",
        message: "PayOS đang gián đoạn. Đơn vẫn được giữ; vui lòng mở lại sau.",
      };
    }
  }
}

type LockedServiceOrder = {
  id: string;
  status: "pending" | "paid" | "cancelled" | "expired" | "refunded";
  amountVnd: number;
  expiresAt: Date;
  providerRef: string | null;
};

/**
 * Ghi nhận một sự kiện PayOS đã xác thực chữ ký cho một đơn dịch vụ.
 *
 * Chỉ được gọi sau khi `processPayosPayment` trả về `unknown_order`, tức mã này
 * không thuộc `orders`. Toàn bộ phần phán xét — mã trả về, số tiền, đơn vị tiền
 * tệ, thời điểm giao dịch so với hạn đơn, link thanh toán có khớp không — dùng
 * lại `classifyPayosPayment` của luồng khóa học chứ không viết lại: hai định
 * nghĩa "đã trả tiền" là hai định nghĩa sẽ trôi khỏi nhau.
 */
export async function processServicePayment(input: PayosPaymentEvent) {
  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<LockedServiceOrder[]>`
      SELECT id,
             status::text AS status,
             amount_vnd   AS "amountVnd",
             expires_at   AS "expiresAt",
             provider_ref AS "providerRef"
        FROM service_orders
       WHERE code = ${input.orderCode}
       FOR UPDATE`;
    const order = locked[0];
    if (!order) {
      return { handled: true as const, outcome: "unknown_order" as const };
    }

    const providerRef =
      input.reference ||
      `${input.paymentLinkId}:${input.orderCode}:${input.amount}:${input.transactionDateTime}`;
    // `payments` là sổ chung của cả hai loại đơn, nên khóa (provider,
    // providerRef) ở đây cũng bắt được trường hợp cùng một mã giao dịch ngân
    // hàng bị gán cho một đơn khóa học — thứ mà hai bảng payment riêng sẽ không
    // bao giờ thấy.
    const existing = await tx.payment.findUnique({
      where: { provider_providerRef: { provider: "payos", providerRef } },
      select: { serviceOrderId: true, status: true },
    });
    if (existing && existing.serviceOrderId !== order.id) {
      return {
        handled: true as const,
        outcome: "reference_conflict" as const,
        review: {
          label: `Đơn dịch vụ #${input.orderCode}`,
          reason: "Mã giao dịch đã thuộc về một đơn khác",
          expectedVnd: order.amountVnd,
          receivedVnd: input.amount,
          providerRef,
        } satisfies PaymentReview,
      };
    }
    if (existing) {
      return {
        handled: true as const,
        outcome:
          existing.status === "requires_review"
            ? ("requires_review" as const)
            : ("duplicate" as const),
        serviceOrderId: order.id,
      };
    }

    const paidAt = payosTransactionTime(input.transactionDateTime);
    const classifierInput = {
      providerCode: input.code,
      orderStatus: order.status,
      expectedAmount: order.amountVnd,
      receivedAmount: input.amount,
      currency: input.currency,
      transactionAt: paidAt,
      expiresAt: order.expiresAt,
      paymentLinkMatches: payosPaymentLinkMatches(
        order.providerRef,
        input.paymentLinkId,
      ),
      // Đơn dịch vụ không sinh ghi danh nào, nên điều kiện về tính nhất quán
      // của ghi danh luôn thỏa. Truyền `true` thay vì tách nhánh khỏi hàm phân
      // loại: mọi điều kiện còn lại phải giống hệt luồng khóa học.
      consistentEnrollments: true,
    };
    const paymentStatus = classifyPayosPayment(classifierInput);

    await tx.payment.create({
      data: {
        serviceOrderId: order.id,
        provider: "payos",
        providerRef,
        amountVnd: input.amount,
        status: paymentStatus,
        payload: input.payload as never,
      },
    });

    if (paymentStatus !== "succeeded") {
      return {
        handled: true as const,
        outcome: paymentStatus,
        serviceOrderId: order.id,
        // Cùng luật với luồng khóa học: chỉ báo động cho hàng vừa được ghi, và
        // chỉ với `requires_review`.
        review:
          paymentStatus === "requires_review"
            ? ({
                label: `Đơn dịch vụ #${input.orderCode}`,
                reason: payosReviewReason(classifierInput),
                expectedVnd: order.amountVnd,
                receivedVnd: input.amount,
                providerRef,
              } satisfies PaymentReview)
            : undefined,
      };
    }

    const moment = paidAt!;
    const flipped = await tx.serviceOrder.updateMany({
      where: { id: order.id, status: "pending" },
      data: {
        status: "paid",
        paidAt: moment,
        closedAt: moment,
        provider: "payos",
        providerRef: order.providerRef ?? input.paymentLinkId,
      },
    });
    if (flipped.count !== 1) {
      throw new Error(`Không thể xác nhận nguyên tử đơn dịch vụ ${order.id}.`);
    }

    return {
      handled: true as const,
      outcome: "succeeded" as const,
      serviceOrderId: order.id,
    };
  }, PAYMENT_TX);
}

/**
 * Đóng một đơn dịch vụ đang chờ, sau khi đã đóng link PayOS của nó.
 *
 * Bản song song của `cancelOrder`, và cố ý giữ nguyên thứ tự: HỎI PayOS TRƯỚC,
 * từ chối khi link đang giữ tiền, rồi mới ghi. Trước đây luồng dịch vụ không có
 * hàm này chút nào — `?huy=1` chỉ đổi bộ chữ trên trang kết quả — nên một học
 * viên bấm "Hủy" trên PayOS vẫn để lại một đơn `pending` và một link sống suốt
 * 24 giờ, tức vẫn trả tiền được cho một đơn mà họ tin là đã hủy.
 *
 * Đơn giản hơn `cancelOrder` ở đúng một điểm: không có ghế và không có credits
 * để trả lại, nên một `updateMany` có lọc `status: "pending"` là đủ nguyên tử.
 */
export async function cancelServiceOrder(
  orderId: string,
  options: { userId?: string; as?: "cancelled" | "expired" } = {},
) {
  const { userId, as = "cancelled" } = options;
  const order = await prisma.serviceOrder.findFirst({
    where: { id: orderId, status: "pending", ...(userId ? { userId } : {}) },
    select: { id: true, code: true, provider: true, providerRef: true, checkoutUrl: true },
  });
  if (!order) return { cancelled: false as const, reason: "not_pending" as const };

  const hasRemoteLink = order.providerRef !== null || order.checkoutUrl !== null;
  if (order.provider === "payos" && hasRemoteLink) {
    try {
      let remote = await payosClient().paymentRequests.get(order.code);
      if (PAYOS_MONEY_STATES.has(remote.status)) {
        return { cancelled: false as const, reason: "payment_in_progress" as const };
      }
      if (remote.status === "PENDING") {
        remote = await payosClient().paymentRequests.cancel(
          order.code,
          as === "expired" ? "Hết hạn đơn dịch vụ" : "Học viên hủy đơn",
        );
      }
      if (PAYOS_MONEY_STATES.has(remote.status) || remote.status === "PENDING") {
        return { cancelled: false as const, reason: "payment_in_progress" as const };
      }
    } catch (error) {
      if (!isPayosNotFound(error)) {
        console.error(`[payos] Không thể đóng link đơn dịch vụ #${order.code}:`, error);
        return { cancelled: false as const, reason: "gateway_unavailable" as const };
      }
    }
  }

  const flipped = await prisma.serviceOrder.updateMany({
    where: { id: order.id, status: "pending", ...(userId ? { userId } : {}) },
    data: { status: as, closedAt: new Date() },
  });
  return flipped.count === 1
    ? { cancelled: true as const }
    : { cancelled: false as const, reason: "not_pending" as const };
}

/**
 * Bản dịch vụ của `syncPayosOrderStatus`: chỉ đọc trạng thái link, không hủy gì
 * ở PayOS, và chỉ ghi khi PayOS đã tự coi link là chết.
 */
export async function syncPayosServiceOrderStatus(
  orderId: string,
  options: { userId?: string } = {},
) {
  const order = await prisma.serviceOrder.findFirst({
    where: {
      id: orderId,
      status: "pending",
      ...(options.userId ? { userId: options.userId } : {}),
    },
    select: { id: true, code: true, provider: true, providerRef: true, checkoutUrl: true },
  });
  if (!order || order.provider !== "payos") return { closed: false as const };
  if (order.providerRef === null && order.checkoutUrl === null) {
    return { closed: false as const };
  }

  let remote;
  try {
    remote = await payosClient().paymentRequests.get(order.code);
  } catch (error) {
    if (!isPayosNotFound(error)) {
      console.error(`[payos] Không đọc được trạng thái đơn dịch vụ #${order.code}:`, error);
    }
    return { closed: false as const };
  }

  const as = PAYOS_DEAD_STATES[remote.status];
  if (!as) return { closed: false as const };

  const flipped = await prisma.serviceOrder.updateMany({
    where: { id: order.id, status: "pending" },
    data: { status: as, closedAt: new Date() },
  });
  return flipped.count === 1 ? { closed: true as const, as } : { closed: false as const };
}

/**
 * Đóng các đơn dịch vụ quá hạn mà không ai trả tiền.
 *
 * Khác `expireStaleOrders`, ở đây KHÔNG gọi PayOS để hủy link: link PayOS đã
 * mang `expiredAt` bằng đúng hạn của đơn nên nó tự chết, và một lượt cron gọi
 * ra ngoài mạng cho việc chỉ mang tính dọn dẹp là một lượt cron có thể hỏng vì
 * lý do không liên quan gì tới nó.
 */
export async function expireStaleServiceOrders(now = new Date()) {
  const closed = await prisma.serviceOrder.updateMany({
    where: { status: "pending", expiresAt: { lt: now } },
    data: { status: "expired", closedAt: now },
  });
  return { expired: closed.count };
}

/**
 * Đơn dịch vụ của CHÍNH người đang đăng nhập, tra theo `ref`.
 *
 * Hai lớp, và cả hai đều cần: `ref` là 16 byte ngẫu nhiên nên không đếm lên
 * được, còn `userId` là thứ khiến một đường link bị chuyển tiếp cho người khác
 * cũng không mở ra được nội dung đơn.
 */
export async function findServiceOrder(ref: string, userId: string) {
  if (!/^[0-9a-f]{32}$/.test(ref)) return null;
  return prisma.serviceOrder.findFirst({
    where: { ref, userId },
    select: {
      // `id` và `providerRef` là hai thứ trang kết quả cần để tự hủy đơn khi
      // PayOS trả người dùng về: `providerRef` để khớp `?id=` (chốt CSRF y hệt
      // /thanh-toan/huy), `id` để gọi `cancelServiceOrder`.
      id: true,
      providerRef: true,
      code: true,
      kind: true,
      tier: true,
      wordCount: true,
      amountVnd: true,
      status: true,
      expiresAt: true,
      checkoutUrl: true,
    },
  });
}
