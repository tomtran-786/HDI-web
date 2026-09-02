import { CHECKOUT_TX, PAYMENT_TX } from "./db-budget";
import { prisma } from "./prisma";
import { confirmEnrollments, reactivateEnrollments, type Db } from "./enrollment";
import { findCourse } from "./courses";
import { isPayosNotFound, payosClient } from "./payos";
import { seatPriceVnd, type GroupPricedCourse } from "./group-pricing";
import { groupApplies } from "./group-invite";
import {
  accrueReferralCommission,
  creditBalanceVnd,
  reclaimCreditReservation,
  reserveCredit,
  settleCreditReservation,
  voidCreditReservation,
} from "./referral-ledger";
import { creditToApply, referralDiscountVnd } from "./referral-pricing";
import { ORDER_TTL_HOURS } from "./order-ttl";

export { ORDER_TTL_HOURS };

/**
 * Khoảng ân hạn sau `expiresAt` mà một khoản tiền về muộn vẫn được tự cấp quyền.
 *
 * Chỉ áp dụng khi mọi điều kiện khác của `classifyPayosPayment` đều thỏa (đúng
 * số tiền, đúng link, đúng ghi danh) và khóa vẫn còn ghế trống — xem
 * `reclaimLatePayment`. Ngoài khoảng này, hoặc khi ghế đã hết, giao dịch vẫn vào
 * `requires_review` để một người xử lý.
 */
export const ORDER_LATE_GRACE_MINUTES = 90;

export type OrderFailure = {
  ok: false;
  reason:
    | "empty"
    | "not_open"
    | "already_enrolled"
    | "no_seats"
    | "group_not_eligible";
  message: string;
  /**
   * Đơn đang chờ thanh toán đã chặn lần đặt này, nếu có.
   *
   * Chỉ có mặt ở `already_enrolled`, và nó là thứ biến một lời từ chối cụt thành
   * một đường đi tiếp: đơn bỏ dở giữ ghế suốt `ORDER_TTL_HOURS`, nên trong quãng
   * đó chính người mua bị chặn khỏi khóa của mình mà không được cho biết phải
   * làm gì. Trang đơn hàng là nơi có nút hủy và nút thanh toán lại.
   *
   * Không còn là đường DUY NHẤT: `lib/cart.ts` cũng mang mã đơn xuống từng dòng
   * khóa, vì một dòng bị `disabled` không bao giờ bấm được nút Thanh toán để
   * chạm tới lời từ chối này.
   */
  pendingOrderCode?: number;
};

/** Người trả tiền, rồi tới các thành viên, theo đúng thứ tự nhóm trưởng gõ. */
export type OrderBuyer = { id: string; email: string };

export type OrderSuccess = {
  ok: true;
  orderId: string;
  code: number;
  /** Số tiền PHẢI TRẢ, tức đã trừ cả hai khoản dưới đây. */
  amountVnd: number;
  /** Giảm 10% cho đơn đầu tiên của người được giới thiệu. 0 nếu không áp dụng. */
  referralDiscountVnd: number;
  /** Credits đã trừ (số dương). 0 nếu học viên không bật hoặc không có số dư. */
  creditAppliedVnd: number;
  groupSize: number;
  expiresAt: Date;
};

export type OrderResult = OrderSuccess | OrderFailure;

type LockedCourse = GroupPricedCourse & {
  id: string;
  slug: string;
  capacity: number;
  status: string;
};

/**
 * Turn a basket of course ids into an order, or refuse and say why.
 *
 * Everything happens inside one transaction that begins by locking the course
 * rows with `SELECT … FOR UPDATE`, in id order. That lock is what makes the
 * seat check mean anything: without it, two people buying the last place both
 * count "1 of 2 taken" and both succeed. Locking in a fixed order is what keeps
 * two overlapping baskets from deadlocking against each other.
 *
 * Prices are read here, from the database, and never taken from the caller.
 *
 * Đơn nhóm KHÔNG có nhánh riêng. `members` là danh sách người học, phần tử đầu
 * là người trả tiền; mua lẻ chỉ là nhóm một người. Một nhánh riêng cho nhóm sẽ
 * là một chỗ nữa để quên khóa dòng hoặc quên đếm ghế.
 */
export async function createOrder(
  payerUserId: string,
  courseIds: string[],
  options: { members?: OrderBuyer[]; useCredit?: boolean } = {},
): Promise<OrderResult> {
  if (courseIds.length === 0) {
    return { ok: false, reason: "empty", message: "Giỏ hàng đang trống." };
  }

  // Khử trùng theo user id, không theo email. `normalizeMemberEmails` đã bỏ
  // email của nhóm trưởng, nhưng session thiếu email hoặc hai địa chỉ cùng trỏ
  // về một tài khoản vẫn lọt tới đây — và hai ghế cùng một người sẽ đâm vào
  // partial unique index của enrollments, tức một lỗi 500 giữa luồng thanh toán.
  const seen = new Set<string>();
  const buyers: OrderBuyer[] = [];
  for (const buyer of [{ id: payerUserId, email: "" }, ...(options.members ?? [])]) {
    if (seen.has(buyer.id)) continue;
    seen.add(buyer.id);
    buyers.push(buyer);
  }
  const groupSize = buyers.length;
  const buyerIds = buyers.map((buyer) => buyer.id);

  const sorted = [...new Set(courseIds)].sort();

  // Never hold row locks while calling PayOS. Reconcile candidates first; the
  // transaction below still performs the authoritative seat count.
  //
  // Hai phạm vi, không phải một: theo KHÓA để trả lại ghế đang bị đơn chết giữ,
  // và theo NGƯỜI để trả lại credits cùng suất giảm giá "đơn đầu tiên" của
  // chính người sắp trả tiền. Tuần tự chứ không `Promise.all`: hai lượt có thể
  // cùng nhắm vào một đơn, và chạy song song là hai lượt gọi PayOS cho cùng một
  // link.
  await reconcileStaleOrdersForCourses(sorted);
  await reconcileStaleOrdersForPayer(payerUserId);

  return prisma.$transaction(async (tx) => {
    /**
     * Khóa hàng người trả tiền TRƯỚC khi khóa courses, và mọi checkout đều theo
     * đúng thứ tự đó — thứ tự khóa cố định giữa hai bảng là thứ giữ cho hai giỏ
     * hàng chồng nhau không deadlock, y hệt lý do `courses` được khóa
     * `ORDER BY id`.
     *
     * Khóa này bảo vệ HAI con số đọc bên dưới: số dư credits và quyền dùng ưu
     * đãi "đơn đầu tiên". Prisma chạy ở READ COMMITTED, nên không có nó thì hai
     * tab checkout của cùng một người cùng đọc thấy số dư đầy đủ và cùng tiêu
     * hết nó, hoặc cùng thấy "chưa dùng ưu đãi" và cùng được giảm.
     */
    const [payer] = await tx.$queryRaw<{ referredById: string | null }[]>`
      SELECT referred_by_id AS "referredById"
        FROM users
       WHERE id = ${payerUserId}
         FOR UPDATE`;

    const locked = await tx.$queryRaw<LockedCourse[]>`
      SELECT id,
             slug,
             price_vnd       AS "priceVnd",
             group_eligible  AS "groupEligible",
             group_price_vnd AS "groupPriceVnd",
             capacity,
             status::text AS status
        FROM courses
       WHERE id = ANY(${sorted}::text[])
       ORDER BY id
         FOR UPDATE`;

    const byId = new Map(locked.map((c) => [c.id, c]));

    const [counts, mine] = await Promise.all([
      tx.$queryRaw<{ courseId: string; held: bigint }[]>`
        SELECT course_id AS "courseId", count(*)::bigint AS held
          FROM enrollments
         WHERE course_id = ANY(${sorted}::text[])
           AND (
             (
               status = 'paid'::enrollment_status
               AND access_revoked_at IS NULL
             )
             OR (
               status = 'pending'::enrollment_status
               AND (
                 NOT EXISTS (
                   SELECT 1 FROM order_items oi
                    WHERE oi.enrollment_id = enrollments.id
                 )
                 OR EXISTS (
                   SELECT 1
                     FROM order_items oi
                     JOIN orders o ON o.id = oi.order_id
                    WHERE oi.enrollment_id = enrollments.id
                      AND o.status = 'pending'::order_status
                      AND o.expires_at > now()
                 )
               )
             )
           )
         GROUP BY course_id`,
      // Mọi người trong nhóm, không riêng người trả tiền: một thành viên đã có
      // quyền cho khóa này thì partial unique index sẽ chặn ở lệnh ghi, và một
      // lỗi ràng buộc thô không nói được cho nhóm trưởng biết vướng ở ai.
      //
      // KHÔNG xét `orders.expires_at` ở đây, dù truy vấn đếm ghế ngay bên trên
      // thì có. Đó chính là index vừa nói: nó chỉ nhìn `enrollments.status`, nên
      // nới điều kiện ở đây là đổi một thông báo đọc được lấy một lỗi P2002.
      // Đơn quá hạn đã được `reconcileStaleOrdersForCourses` và
      // `reconcileStaleOrdersForPayer` đóng trước khi vào transaction này.
      tx.enrollment.findMany({
        where: {
          userId: { in: buyerIds },
          courseId: { in: sorted },
          OR: [
            { status: "pending" },
            { status: "paid", accessRevokedAt: null },
          ],
        },
        select: { courseId: true, userId: true },
      }),
    ]);

    const taken = new Map(counts.map((row) => [row.courseId, Number(row.held)]));
    const existing = new Set(mine.map((row) => `${row.userId}:${row.courseId}`));
    const emailById = new Map(buyers.map((buyer) => [buyer.id, buyer.email]));

    // Validate the whole basket before writing anything. A half-placed order is
    // worse than a refused one, and refusing costs the student one message
    // instead of one message per line.
    for (const id of sorted) {
      const course = byId.get(id);
      if (!course || course.status !== "open" || !findCourse(course.slug)) {
        return {
          ok: false as const,
          reason: "not_open" as const,
          message: "Một khóa trong giỏ vừa đóng đăng ký. Vui lòng xem lại giỏ hàng.",
        };
      }

      const title = findCourse(course.slug)?.title ?? course.slug;

      const clash = buyerIds.find((buyerId) => existing.has(`${buyerId}:${id}`));
      if (clash) {
        const email = emailById.get(clash);
        // Đơn nào đang chặn? Chỉ tra khi đã chắc chắn từ chối, nên nó không nằm
        // trên đường đi của một lần đặt đơn thành công. Lọc theo NGƯỜI TRẢ TIỀN
        // vì chỉ đơn của họ mới hủy được từ trang đơn hàng của họ; một ghế do
        // nhóm trưởng khác trả tiền thì mã đơn đó không giúp được gì.
        const blocking = await tx.order.findFirst({
          where: {
            userId: payerUserId,
            status: "pending",
            items: { some: { courseId: id, memberUserId: clash } },
          },
          select: { code: true },
          orderBy: { createdAt: "desc" },
        });
        return {
          ok: false as const,
          reason: "already_enrolled" as const,
          message: email
            ? `Bạn ${email} đang có quyền hoặc đơn chờ thanh toán cho khóa ${title}.`
            : `Bạn đang có quyền hoặc đơn chờ thanh toán cho khóa ${title}.`,
          ...(blocking ? { pendingOrderCode: blocking.code } : {}),
        };
      }

      // Nhóm chiếm đúng `groupSize` ghế, nên phép so là "còn đủ chỗ cho cả
      // nhóm" chứ không phải "còn ít nhất một chỗ".
      if ((taken.get(id) ?? 0) + groupSize > course.capacity) {
        const seatsLeft = Math.max(0, course.capacity - (taken.get(id) ?? 0));
        return {
          ok: false as const,
          reason: "no_seats" as const,
          message:
            groupSize > 1
              ? `Khóa ${title} chỉ còn ${seatsLeft} chỗ, không đủ cho nhóm ${groupSize} người.`
              : `Khóa ${title} đã hết chỗ.`,
        };
      }
    }

    /**
     * Một đơn nhiều người chỉ hợp lệ khi giỏ thật sự có mời nhóm.
     *
     * Trình duyệt chỉ hiện ô mời khi giỏ còn khóa hưởng ưu đãi, nhưng các input
     * ẩn mang danh sách thành viên nằm ngoài điều kiện đó — nên một lỗi ở client
     * đủ để gửi lên ba email cho một giỏ chỉ còn khóa KHÔNG có ưu đãi, và đơn ra
     * là ba ghế giá lẻ. Tổng tiền server tính khớp với con số client hiển thị,
     * nên `tongTienDuKien` không bắt được; đây là chốt duy nhất bắt được.
     *
     * Đọc từ chính các hàng vừa khóa FOR UPDATE, không từ đầu vào của người gọi.
     */
    if (!groupApplies(groupSize - 1, locked.some((course) => course.groupEligible))) {
      return {
        ok: false as const,
        reason: "group_not_eligible" as const,
        message:
          "Không khóa nào trong giỏ áp dụng ưu đãi nhóm. Vui lòng bỏ danh sách thành viên hoặc chọn một khóa có ưu đãi nhóm.",
      };
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ORDER_TTL_HOURS * 3600 * 1000);

    // Giá một ghế tính MỘT lần cho mỗi khóa: mọi thành viên trả như nhau, và
    // làm tròn đã xảy ra trong seatPriceVnd.
    const seatPrice = new Map(
      sorted.map((id) => [id, seatPriceVnd(byId.get(id)!, groupSize)] as const),
    );

    /**
     * Every purchase gets a new access window. Old paid/cancelled rows remain
     * immutable history and are never reset in place.
     *
     * MỘT lệnh ghi cho cả đơn, không phải một lệnh cho mỗi ghế. Nhóm mười người
     * mua vài khóa là hàng chục ghế, và mỗi ghế một round-trip đẩy transaction
     * này vượt hạn của Prisma — khi đó cả đơn lẫn ghi danh cùng rollback ngay
     * giữa luồng thanh toán, và học viên chỉ thấy một lỗi 500 không giải thích
     * được. `(userId, courseId)` là duy nhất trong lô vì `buyers` đã khử trùng
     * theo id và `sorted` là một tập hợp, nên ánh xạ ngược bên dưới không mơ hồ.
     */
    const created = await tx.enrollment.createManyAndReturn({
      data: sorted.flatMap((id) =>
        buyers.map((buyer) => ({ userId: buyer.id, courseId: id })),
      ),
      select: { id: true, userId: true, courseId: true },
    });

    const items = created.map((enrollment) => ({
      courseId: enrollment.courseId,
      memberUserId: enrollment.userId,
      priceVnd: seatPrice.get(enrollment.courseId)!,
      enrollmentId: enrollment.id,
    }));

    const subtotalVnd = items.reduce((sum, i) => sum + i.priceVnd, 0);

    /**
     * Tổng theo GIÁ NIÊM YẾT của cùng những ghế đó.
     *
     * Cần để `referralDiscountVnd` biết ưu đãi nhóm đã giảm bao nhiêu rồi: từ
     * 2026-09-01 hai ưu đãi không cộng dồn, đơn chỉ hưởng mức cao nhất. Đọc từ
     * chính các hàng đã khóa FOR UPDATE, không từ đầu vào của người gọi.
     */
    const listSubtotalVnd = items.reduce(
      (sum, i) => sum + byId.get(i.courseId)!.priceVnd,
      0,
    );

    /**
     * "Một lần cho mỗi tài khoản" đọc ra thành hai điều kiện.
     *
     * Đơn `paid` nào cũng chặn, vì ưu đãi gắn với LẦN THANH TOÁN ĐẦU TIÊN. Đơn
     * `pending` đang mang ưu đãi cũng chặn, nếu không thì mở hai tab là được
     * giảm hai lần — người ta chỉ cần trả một đơn và bỏ đơn kia.
     *
     * Index `orders_referral_discount_once_key` trong database là lớp thứ hai
     * của cùng luật này, độc lập với đoạn code ở đây.
     */
    const claimed = await tx.order.findFirst({
      where: {
        userId: payerUserId,
        OR: [
          { status: "paid" },
          { status: "pending", referralDiscountVnd: { gt: 0 } },
        ],
      },
      select: { id: true },
    });

    const referralDiscount = referralDiscountVnd({
      listSubtotalVnd,
      subtotalVnd,
      eligible: payer?.referredById != null && claimed === null,
    });

    const creditApplied = creditToApply({
      balanceVnd: await creditBalanceVnd(tx, payerUserId, now),
      dueVnd: subtotalVnd - referralDiscount,
      // Trần 30%: credits chỉ gánh được một phần học phí của lần đăng ký này.
      tuitionVnd: subtotalVnd,
      // Trình duyệt chỉ gửi lên Ý MUỐN bật/tắt, không bao giờ là số tiền (BR-02).
      wanted: options.useCredit === true,
    });

    const order = await tx.order.create({
      data: {
        userId: payerUserId,
        amountVnd: subtotalVnd - referralDiscount - creditApplied,
        referralDiscountVnd: referralDiscount,
        creditAppliedVnd: creditApplied,
        groupSize,
        expiresAt,
        provider: "payos",
        items: { create: items },
      },
      select: { id: true, code: true, amountVnd: true },
    });

    // Giữ chỗ credits NGAY, không đợi tới lúc trả tiền: link PayOS sắp được tạo
    // với một số tiền cố định, nên khoản trừ phải chốt trước khi link tồn tại.
    await reserveCredit(tx, {
      userId: payerUserId,
      orderId: order.id,
      amountVnd: creditApplied,
    });

    return {
      ok: true as const,
      orderId: order.id,
      code: order.code,
      amountVnd: order.amountVnd,
      referralDiscountVnd: referralDiscount,
      creditAppliedVnd: creditApplied,
      groupSize,
      expiresAt,
    };
  }, CHECKOUT_TX);
}

export type PayosPaymentEvent = {
  orderCode: number;
  amount: number;
  currency: string;
  reference: string;
  paymentLinkId: string;
  transactionDateTime: string;
  code: string;
  payload: unknown;
};

type LockedOrder = {
  id: string;
  userId: string;
  status: "pending" | "paid" | "cancelled" | "expired" | "refunded";
  amountVnd: number;
  /** Cần để dựng lại tiền thực thu làm căn cứ tính hoa hồng. */
  creditAppliedVnd: number;
  expiresAt: Date;
  providerRef: string | null;
};

export function payosTransactionTime(value: string) {
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? `${value.replace(" ", "T")}+07:00`
    : value;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function payosPaymentLinkMatches(
  storedPaymentLinkId: string | null,
  receivedPaymentLinkId: string,
) {
  return (
    receivedPaymentLinkId.length > 0 &&
    (!storedPaymentLinkId || storedPaymentLinkId === receivedPaymentLinkId)
  );
}

export function classifyPayosPayment(input: {
  providerCode: string;
  orderStatus: LockedOrder["status"];
  expectedAmount: number;
  receivedAmount: number;
  currency: string;
  transactionAt: Date | null;
  expiresAt: Date;
  paymentLinkMatches: boolean;
  consistentEnrollments: boolean;
}): "succeeded" | "failed" | "requires_review" {
  if (input.providerCode !== "00") return "failed";
  if (
    input.orderStatus !== "pending" ||
    input.receivedAmount !== input.expectedAmount ||
    input.currency !== "VND" ||
    !input.transactionAt ||
    input.transactionAt > input.expiresAt ||
    !input.paymentLinkMatches ||
    !input.consistentEnrollments
  ) {
    return "requires_review";
  }
  return "succeeded";
}

/**
 * Mô tả đọc được của việc một giao dịch phải vào hàng chờ đối soát.
 *
 * `classifyPayosPayment` cố ý chỉ trả về một phán quyết — nó là cửa quyết định
 * có cấp quyền hay không, và một cửa như vậy càng ít nhánh càng tốt. Nhưng
 * người phải xử lý hàng chờ thì cần biết vướng ở đâu, và "sai số tiền" với
 * "đơn đã đóng" là hai việc phải làm hoàn toàn khác nhau.
 *
 * Thứ tự các mệnh đề khớp đúng thứ tự trong `classifyPayosPayment`, nên câu trả
 * lời luôn là điều kiện ĐẦU TIÊN không thỏa.
 */
export function payosReviewReason(
  input: Parameters<typeof classifyPayosPayment>[0],
): string {
  if (input.providerCode !== "00") {
    return `PayOS trả mã lỗi ${input.providerCode}`;
  }
  if (input.orderStatus !== "pending") {
    return `Đơn không còn chờ thanh toán (đang ở "${input.orderStatus}")`;
  }
  if (input.receivedAmount !== input.expectedAmount) return "Số tiền không khớp";
  if (input.currency !== "VND") return `Đơn vị tiền tệ lạ (${input.currency})`;
  if (!input.transactionAt) return "Không đọc được thời điểm giao dịch";
  if (input.transactionAt > input.expiresAt) return "Giao dịch xảy ra sau hạn đơn";
  if (!input.paymentLinkMatches) return "Payment link không khớp với đơn";
  if (!input.consistentEnrollments) return "Ghi danh của đơn không nhất quán";
  return "Không xác định";
}

/**
 * Những gì một quản trị viên cần biết để bắt đầu xử lý một khoản tiền treo.
 *
 * Trả về từ transaction thay vì gửi thư ngay tại chỗ: gửi thư là một lượt gọi
 * mạng ra ngoài, và giữ một hàng đơn bị khóa suốt lượt gọi đó là đúng cái điều
 * mà `notifyGroupMembers` đã được đẩy ra ngoài transaction để tránh.
 */
export type PaymentReview = {
  label: string;
  reason: string;
  /** Số tiền đơn đang chờ. `null` chỉ để lá thư còn dựng được nếu về sau có một
   *  nguồn sự kiện không gắn với đơn nào. */
  expectedVnd: number | null;
  receivedVnd: number;
  providerRef: string;
};

/**
 * Số ghế đang bị giữ cho mỗi khóa: ghi danh `paid` còn hiệu lực, cộng các suất
 * `pending` mà đơn của nó vẫn còn hạn (hoặc suất mồ côi không có dòng đơn nào).
 *
 * Cùng vị từ với truy vấn đếm ghế trong `createOrder`. Một đơn quá hạn KHÔNG
 * tính vào vì `o.expires_at > now()` — nên đơn đang được cứu không tự chặn chính
 * nó.
 */
async function countHeldSeats(
  tx: Db,
  courseIds: string[],
): Promise<Map<string, number>> {
  if (courseIds.length === 0) return new Map();
  const rows = await tx.$queryRaw<{ courseId: string; held: bigint }[]>`
    SELECT course_id AS "courseId", count(*)::bigint AS held
      FROM enrollments
     WHERE course_id = ANY(${courseIds}::text[])
       AND (
         (
           status = 'paid'::enrollment_status
           AND access_revoked_at IS NULL
         )
         OR (
           status = 'pending'::enrollment_status
           AND (
             NOT EXISTS (
               SELECT 1 FROM order_items oi
                WHERE oi.enrollment_id = enrollments.id
             )
             OR EXISTS (
               SELECT 1
                 FROM order_items oi
                 JOIN orders o ON o.id = oi.order_id
                WHERE oi.enrollment_id = enrollments.id
                  AND o.status = 'pending'::order_status
                  AND o.expires_at > now()
             )
           )
         )
       )
     GROUP BY course_id`;
  return new Map(rows.map((row) => [row.courseId, Number(row.held)]));
}

type ReclaimItem = {
  enrollmentId: string | null;
  memberUserId: string;
  courseId: string;
  course: { capacity: number };
  enrollment: { userId: string; status: string } | null;
};

/**
 * Cửa quyết định "có được cứu một khoản tiền về muộn không".
 *
 * Chạy khi `classifyPayosPayment` đã trả `requires_review`. Chỉ mở khi thứ DUY
 * NHẤT vướng là giao dịch xảy ra sau `expiresAt` và/hoặc đơn đã bị một lượt quét
 * đóng thành `expired` — mọi điều kiện còn lại (đúng mã, đúng số tiền, đúng
 * link, ghi danh nhất quán) phải sạch — VÀ khóa vẫn còn ghế, không có ghi danh
 * hiệu lực nào khác cho cùng (người, khóa), và số dư credits vẫn phủ được phần
 * đã giữ chỗ nếu lượt quét đã trả nó về ví.
 *
 * CHỈ ĐỌC. Khóa hàng `users` FOR UPDATE để hai vế đọc bên dưới (đếm ghế, số dư)
 * không đua với một checkout song song, đúng kỷ luật của `createOrder`. Lệnh ghi
 * `void → applied` cho credits do nơi gọi thực hiện sau khi cửa này mở.
 *
 * `adminOverride` bỏ đúng một điều kiện: khoảng ân hạn. Một quản trị viên đã
 * nhìn giao dịch và xác nhận tiền có thật thì "muộn bao lâu" không còn là câu
 * hỏi; ghế, ràng buộc ghi danh và số dư thì vẫn phải kiểm.
 */
async function reclaimLatePayment(
  tx: Db,
  input: {
    order: LockedOrder;
    items: ReclaimItem[];
    transactionAt: Date | null;
    providerCode: string;
    receivedAmount: number;
    currency: string;
    paymentLinkMatches: boolean;
    adminOverride?: boolean;
  },
): Promise<{ eligible: boolean; reason?: string }> {
  const { order, items, transactionAt } = input;

  if (input.providerCode !== "00") return { eligible: false, reason: "PayOS trả mã lỗi" };
  if (!transactionAt) return { eligible: false, reason: "Không đọc được thời điểm giao dịch" };
  if (input.receivedAmount !== order.amountVnd) {
    return { eligible: false, reason: "Số tiền không khớp" };
  }
  if (input.currency !== "VND") return { eligible: false, reason: "Đơn vị tiền tệ lạ" };
  if (!input.paymentLinkMatches) return { eligible: false, reason: "Payment link không khớp" };
  if (order.status !== "pending" && order.status !== "expired") {
    return { eligible: false, reason: `Đơn đang ở "${order.status}", không tự cứu` };
  }

  const reclaimableEnrollments =
    items.length > 0 &&
    items.every(
      (item) =>
        item.enrollmentId &&
        item.enrollment?.userId === item.memberUserId &&
        (item.enrollment.status === "pending" || item.enrollment.status === "cancelled"),
    );
  if (!reclaimableEnrollments) {
    return { eligible: false, reason: "Ghi danh của đơn không nhất quán" };
  }

  if (!input.adminOverride) {
    const graceMs = ORDER_LATE_GRACE_MINUTES * 60_000;
    if (transactionAt.getTime() > order.expiresAt.getTime() + graceMs) {
      return { eligible: false, reason: "Giao dịch quá xa hạn đơn" };
    }
  }

  await tx.$queryRaw`SELECT id FROM users WHERE id = ${order.userId} FOR UPDATE`;

  const courseIds = [...new Set(items.map((item) => item.courseId))];
  const held = await countHeldSeats(tx, courseIds);
  const needed = new Map<string, number>();
  const capacity = new Map<string, number>();
  for (const item of items) {
    needed.set(item.courseId, (needed.get(item.courseId) ?? 0) + 1);
    capacity.set(item.courseId, item.course.capacity);
  }
  const seatShort = courseIds.some(
    (id) => (held.get(id) ?? 0) + (needed.get(id) ?? 0) > (capacity.get(id) ?? 0),
  );
  if (seatShort) return { eligible: false, reason: "Khóa đã hết chỗ" };

  const enrollmentIds = items
    .map((item) => item.enrollmentId)
    .filter((id): id is string => id !== null);
  const clash = await tx.enrollment.findFirst({
    where: {
      AND: [
        { id: { notIn: enrollmentIds } },
        { OR: [{ status: "pending" }, { status: "paid", accessRevokedAt: null }] },
        { OR: items.map((item) => ({ userId: item.memberUserId, courseId: item.courseId })) },
      ],
    },
    select: { id: true },
  });
  if (clash) return { eligible: false, reason: "Đã có ghi danh hiệu lực cho khóa này" };

  if (order.creditAppliedVnd > 0) {
    const redemption = await tx.referralLedger.findFirst({
      where: { orderId: order.id, type: "redemption" },
      select: { status: true },
    });
    if (!redemption) {
      return { eligible: false, reason: "Không tìm thấy khoản giữ chỗ credits" };
    }
    if (redemption.status === "void") {
      // Số dư đã CỘNG lại khoản void này; chỉ trừ lại được khi vẫn còn đủ.
      const balance = await creditBalanceVnd(tx, order.userId, new Date());
      if (balance < order.creditAppliedVnd) {
        return { eligible: false, reason: "Số dư credits đã đổi" };
      }
    }
  }

  return { eligible: true };
}

/**
 * Record a signed PayOS event and update the order aggregate in one short
 * transaction. A crash can therefore leave neither half committed.
 */
export async function processPayosPayment(input: PayosPaymentEvent) {
  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<LockedOrder[]>`
      SELECT id,
             user_id AS "userId",
             status::text AS status,
             amount_vnd AS "amountVnd",
             credit_applied_vnd AS "creditAppliedVnd",
             expires_at AS "expiresAt",
             provider_ref AS "providerRef"
        FROM orders
       WHERE code = ${input.orderCode}
       FOR UPDATE`;
    const order = locked[0];
    if (!order) {
      return { handled: true as const, outcome: "unknown_order" as const };
    }

    const providerRef =
      input.reference ||
      `${input.paymentLinkId}:${input.orderCode}:${input.amount}:${input.transactionDateTime}`;
    const existing = await tx.payment.findUnique({
      where: { provider_providerRef: { provider: "payos", providerRef } },
      select: { orderId: true, status: true },
    });
    if (existing && existing.orderId !== order.id) {
      return {
        handled: true as const,
        outcome: "reference_conflict" as const,
        // Cùng một mã giao dịch ngân hàng gắn với hai đơn khác nhau. Không có
        // đường tự xử lý nào đúng ở đây, nên nó luôn phải tới tay một con người.
        review: {
          label: `Đơn #${input.orderCode}`,
          reason: "Mã giao dịch đã thuộc về một đơn khác",
          expectedVnd: order.amountVnd,
          receivedVnd: input.amount,
          providerRef,
        } satisfies PaymentReview,
      };
    }
    if (existing) {
      // A bank reference identifies one immutable provider event. Never let a
      // later payload with the same reference reinterpret a recorded mismatch
      // and grant access. Exact redeliveries and conflicting replays are both
      // acknowledged without another state transition; the stored event stays
      // append-only evidence for reconciliation.
      return {
        handled: true as const,
        outcome: existing.status === "requires_review"
          ? "requires_review" as const
          : "duplicate" as const,
        orderId: order.id,
        // Nhưng VẪN chạy lại phần giao hàng khi lượt trước đã thu tiền thành
        // công. Cấp quyền Drive và gửi thư nằm NGOÀI transaction này, sau khi
        // nó đã commit — nên một lambda hết giờ để lại một đơn `paid` chưa được
        // giao. Trước đây lượt giao lại dừng ở đây, và khi đó không còn lượt nào
        // nữa: cron ngày vá được quyền Drive (chậm tối đa 24 giờ trên Vercel
        // Hobby), còn thư báo thành viên thì không có gì vá.
        //
        // An toàn để chạy lại: `reconcileDriveFolder` bỏ qua ghi danh đã có
        // `drivePermissionId`, và `notifyGroupMembers` bỏ qua dòng đơn đã có
        // `notifiedAt`.
        fulfill: existing.status === "succeeded" && order.status === "paid",
      };
    }

    const paidAt = payosTransactionTime(input.transactionDateTime);
    const paymentLinkMatches = payosPaymentLinkMatches(
      order.providerRef,
      input.paymentLinkId,
    );
    const items = await tx.orderItem.findMany({
      where: { orderId: order.id },
      select: {
        enrollmentId: true,
        memberUserId: true,
        courseId: true,
        course: { select: { capacity: true } },
        enrollment: { select: { userId: true, status: true } },
      },
      orderBy: { id: "asc" },
    });
    // Ghi danh phải thuộc đúng người được khai trên CHÍNH dòng đơn đó, không
    // phải thuộc người trả tiền. Với đơn lẻ hai vế bằng nhau nên không đổi gì;
    // với đơn nhóm, so theo người trả tiền sẽ đẩy mọi thanh toán nhóm vào
    // `requires_review`. Bản này còn chặt hơn bản cũ: nó bắt được cả trường hợp
    // một dòng đơn bị gắn nhầm sang ghi danh của người khác trong nhóm.
    const consistentEnrollments =
      items.length > 0 &&
      items.every(
        (item) =>
          item.enrollmentId &&
          item.enrollment?.userId === item.memberUserId &&
          item.enrollment.status === "pending",
      );

    // Một object, dùng cho cả phán quyết lẫn lời giải thích. Dựng lại lần thứ
    // hai cho `payosReviewReason` là mở đường cho hai bên nói khác nhau về cùng
    // một sự kiện.
    const classifierInput = {
      providerCode: input.code,
      orderStatus: order.status,
      expectedAmount: order.amountVnd,
      receivedAmount: input.amount,
      currency: input.currency,
      transactionAt: paidAt,
      expiresAt: order.expiresAt,
      paymentLinkMatches,
      consistentEnrollments,
    };
    let paymentStatus = classifyPayosPayment(classifierInput);

    // Cứu một khoản tiền về muộn. Nếu `classifyPayosPayment` chỉ vướng "giao
    // dịch sau hạn đơn" hoặc "đơn đã bị một lượt quét đóng", mà khóa vẫn còn ghế
    // và mọi thứ khác sạch, thì mở lại đơn thay vì đẩy vào hàng đối soát thủ
    // công — khách trả đúng tiền, chỉ về chậm. Xem `reclaimLatePayment`.
    let reclaimed = false;
    if (paymentStatus === "requires_review") {
      const gate = await reclaimLatePayment(tx, {
        order,
        items,
        transactionAt: paidAt,
        providerCode: input.code,
        receivedAmount: input.amount,
        currency: input.currency,
        paymentLinkMatches,
      });
      if (gate.eligible) {
        paymentStatus = "succeeded";
        reclaimed = true;
      }
    }

    await tx.payment.create({
      data: {
        orderId: order.id,
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
        orderId: order.id,
        // CHỈ báo động khi vừa ghi một hàng `payments` mới, và chỉ với
        // `requires_review`. `failed` là một lần chuyển khoản không thành của
        // khách — không có tiền nào vào, không có gì để xử lý. Nhánh `existing`
        // phía trên cũng cố ý không mang cờ này: lượt đầu đã báo rồi, và một
        // lá thư cho mỗi lần PayOS giao lại là cách nhanh nhất dạy người nhận
        // bỏ qua loại thư này.
        review:
          paymentStatus === "requires_review"
            ? ({
                label: `Đơn #${input.orderCode}`,
                reason: payosReviewReason(classifierInput),
                expectedVnd: order.amountVnd,
                receivedVnd: input.amount,
                providerRef,
              } satisfies PaymentReview)
            : undefined,
      };
    }

    const moment = paidAt!;
    const flipped = await tx.order.updateMany({
      // Đơn được cứu đang ở `expired`, không phải `pending` — nới điều kiện cho
      // đúng nhánh đó. Đường thường vẫn chỉ nhận `pending`.
      where: {
        id: order.id,
        status: reclaimed ? { in: ["pending", "expired"] } : "pending",
      },
      data: {
        status: "paid",
        paidAt: moment,
        closedAt: moment,
        provider: "payos",
        providerRef: order.providerRef ?? input.paymentLinkId,
      },
    });
    if (flipped.count !== 1) {
      throw new Error(`Không thể xác nhận nguyên tử đơn ${order.id}.`);
    }

    // Cả lô trong vài lệnh ghi, không phải hai truy vấn cho mỗi ghế. Xem khối
    // chú thích ở `confirmEnrollments`: transaction này chạy bên trong webhook,
    // và vượt hạn ở đây làm bay luôn hàng `payments` vừa ghi — tiền vào tài
    // khoản mà không để lại dấu vết nào, kể cả trong hàng chờ đối soát.
    //
    // Đơn được cứu cần `reactivateEnrollments`: một lượt quét đã hủy ghi danh
    // của nó, nên `confirmEnrollments` (chỉ nhận `pending`) sẽ không vực dậy
    // được hàng nào.
    const { confirmed: enrolled } = reclaimed
      ? await reactivateEnrollments(
          items.map((item) => item.enrollmentId!),
          tx,
          moment,
        )
      : await confirmEnrollments(
          items.map((item) => item.enrollmentId!),
          tx,
          moment,
        );

    // Đóng sổ khoản credits đã giữ chỗ. Về số học là no-op — `reserved` và
    // `applied` đều được tính vào số dư — nhưng đối soát cần phân biệt "đang
    // giữ" với "đã tiêu thật". Đơn được cứu có thể đã bị `voidCreditReservation`
    // bởi lượt quét; `reclaimCreditReservation` trừ lại đúng khoản đó, và
    // `reclaimLatePayment` đã kiểm số dư còn phủ trước khi tới đây.
    if (reclaimed) {
      await reclaimCreditReservation(
        tx,
        {
          userId: order.userId,
          orderId: order.id,
          amountVnd: order.creditAppliedVnd,
        },
        moment,
      );
    } else {
      await settleCreditReservation(tx, order.id, moment);
    }

    /**
     * Hoa hồng cho người giới thiệu của NGƯỜI TRẢ TIỀN.
     *
     * Căn cứ là tiền thực thu CỘNG LẠI phần credits đã trừ: credits là khoản
     * thưởng đã ghi nợ từ trước chứ không phải một khoản giảm giá, nên trừ nó
     * khỏi căn cứ là tính hai lần trên cùng một đồng.
     *
     * Luật "một lần cho mỗi tài khoản" KHÔNG được kiểm ở đây — nó nằm ở partial
     * unique index `referral_ledger_commission_referee_key`, và `skipDuplicates`
     * là thứ biến va chạm index thành một no-op im lặng. Cùng cơ chế đó cũng
     * chặn luôn lượt webhook được PayOS giao lại.
     *
     * Trần "5 lượt thưởng trong 6 tháng" thì ngược lại: nó cần đếm nhiều hàng
     * nên không có index nào đỡ, và `accrueReferralCommission` đếm bên trong
     * chính transaction này.
     */
    const payer = await tx.user.findUnique({
      where: { id: order.userId },
      select: { referredById: true },
    });
    await accrueReferralCommission(tx, {
      referrerId: payer?.referredById,
      payerUserId: order.userId,
      orderId: order.id,
      basisVnd: order.amountVnd + order.creditAppliedVnd,
      now: moment,
    });

    return {
      handled: true as const,
      outcome: "succeeded" as const,
      orderId: order.id,
      enrolled,
      fulfill: true as const,
      // Đúng khi đơn được vực dậy từ `expired` sau một khoản tiền về muộn — để
      // route webhook ghi lại một dòng log (không phải một lá thư: đây là thành
      // công, không phải việc cần người xử lý).
      reclaimed,
    };
  }, PAYMENT_TX);
}

/**
 * Cấp quyền cho một giao dịch đang nằm trong hàng đối soát thủ công.
 *
 * KHÔNG phải một "nút đã thanh toán" mới. Nó chạy đúng cái cổng
 * `reclaimLatePayment` mà webhook đã chạy, chỉ bỏ đúng một ràng buộc — khoảng ân
 * hạn — vì một người đã nhìn giao dịch và xác nhận tiền có thật. Ghế, ràng buộc
 * ghi danh và số dư credits vẫn được kiểm; hết ghế thì trả `granted: false` để
 * quản trị viên chọn hoàn tiền.
 *
 * Phần giao hàng (Drive + thư) chạy NGOÀI transaction này, do nơi gọi lo — y
 * hệt route webhook.
 */
export async function grantReviewedPayment(paymentId: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        status: true,
        reconciledAt: true,
        orderId: true,
        receivedAt: true,
      },
    });
    if (!payment || !payment.orderId) {
      return {
        granted: false as const,
        message: "Giao dịch không gắn với một đơn khóa học.",
      };
    }
    if (payment.status !== "requires_review" || payment.reconciledAt) {
      return { granted: false as const, message: "Giao dịch này không còn chờ xử lý." };
    }

    const locked = await tx.$queryRaw<LockedOrder[]>`
      SELECT id,
             user_id AS "userId",
             status::text AS status,
             amount_vnd AS "amountVnd",
             credit_applied_vnd AS "creditAppliedVnd",
             expires_at AS "expiresAt",
             provider_ref AS "providerRef"
        FROM orders
       WHERE id = ${payment.orderId}
       FOR UPDATE`;
    const order = locked[0];
    if (!order) return { granted: false as const, message: "Không tìm thấy đơn." };

    const items = await tx.orderItem.findMany({
      where: { orderId: order.id },
      select: {
        enrollmentId: true,
        memberUserId: true,
        courseId: true,
        course: { select: { capacity: true } },
        enrollment: { select: { userId: true, status: true } },
      },
      orderBy: { id: "asc" },
    });

    const paidAt = payment.receivedAt;
    const gate = await reclaimLatePayment(tx, {
      order,
      items,
      transactionAt: paidAt,
      providerCode: "00",
      receivedAmount: order.amountVnd,
      currency: "VND",
      paymentLinkMatches: true,
      adminOverride: true,
    });
    if (!gate.eligible) {
      return {
        granted: false as const,
        message: gate.reason ?? "Không đủ điều kiện cấp quyền.",
      };
    }

    const flipped = await tx.order.updateMany({
      where: { id: order.id, status: { in: ["pending", "expired"] } },
      data: {
        status: "paid",
        paidAt,
        closedAt: paidAt,
        provider: "payos",
        providerRef: order.providerRef,
      },
    });
    if (flipped.count !== 1) {
      throw new Error(`Không thể xác nhận nguyên tử đơn ${order.id}.`);
    }

    await reactivateEnrollments(
      items.map((item) => item.enrollmentId!),
      tx,
      paidAt,
    );
    if (order.creditAppliedVnd > 0) {
      await reclaimCreditReservation(
        tx,
        {
          userId: order.userId,
          orderId: order.id,
          amountVnd: order.creditAppliedVnd,
        },
        paidAt,
      );
    }

    const payer = await tx.user.findUnique({
      where: { id: order.userId },
      select: { referredById: true },
    });
    await accrueReferralCommission(tx, {
      referrerId: payer?.referredById,
      payerUserId: order.userId,
      orderId: order.id,
      basisVnd: order.amountVnd + order.creditAppliedVnd,
      now: paidAt,
    });

    // Lật chính hàng `payments` này khỏi hàng chờ. `status: "requires_review"`
    // trong `where` là cửa idempotency: hai lần bấm không cùng cấp quyền hai lần.
    await tx.payment.updateMany({
      where: { id: payment.id, status: "requires_review" },
      data: { status: "succeeded", reconciledAt: new Date() },
    });

    return { granted: true as const, orderId: order.id };
  }, PAYMENT_TX);
}

/**
 * Close a pending order and give its seats back.
 *
 * `expired` and `cancelled` are separate outcomes so a released seat can be
 * told apart from a deliberate refusal when reading the numbers later.
 *
 * Passing `userId` scopes the update, so the student-facing cancel button can
 * only ever touch that student's own order — a server action is its own
 * endpoint and the id in it comes from the browser.
 */
async function cancelOrderLocally(
  orderId: string,
  options: { userId?: string; as?: "cancelled" | "expired" } = {},
) {
  const { userId, as = "cancelled" } = options;

  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const flipped = await tx.order.updateMany({
      where: { id: orderId, status: "pending", ...(userId ? { userId } : {}) },
      data: { status: as, closedAt: now },
    });
    if (flipped.count === 0) {
      return { cancelled: false as const, released: 0, reason: "not_pending" as const };
    }

    const items = await tx.orderItem.findMany({
      where: { orderId },
      select: { enrollmentId: true },
    });
    const enrollmentIds = items
      .map((i) => i.enrollmentId)
      .filter((id): id is string => id !== null);

    // `status: "pending"` in the filter is not decoration: an enrolment that
    // somehow became paid must never be revoked by a cancellation racing it.
    const released = await tx.enrollment.updateMany({
      where: { id: { in: enrollmentIds }, status: "pending" },
      data: { status: "cancelled", accessRevokedAt: now },
    });

    // Trả credits về ví trong CÙNG transaction đã đóng đơn. Mọi đường hủy —
    // nút của học viên, trang PayOS trả về, rollback chốt giá, quản trị viên,
    // đối soát trước mỗi lần đặt đơn mới, và cron hằng ngày — đều đi qua đây,
    // nên đây là chỗ duy nhất cần biết chuyện này.
    await voidCreditReservation(tx, orderId, now);

    return { cancelled: true as const, released: released.count };
  }, PAYMENT_TX);
}

/** Link đang giữ tiền: không đường hủy nào được phép đụng vào. */
export const PAYOS_MONEY_STATES = new Set(["PAID", "PROCESSING", "UNDERPAID"]);

/** Cancel/expire remotely first; gateway uncertainty never releases a seat. */
export async function cancelOrder(
  orderId: string,
  options: { userId?: string; as?: "cancelled" | "expired" } = {},
) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      status: "pending",
      ...(options.userId ? { userId: options.userId } : {}),
    },
    select: {
      id: true,
      code: true,
      provider: true,
      providerRef: true,
      checkoutUrl: true,
    },
  });
  if (!order) {
    return { cancelled: false as const, released: 0, reason: "not_pending" as const };
  }

  /**
   * Chưa có link thì không có gì ngoài kia đang giữ tiền.
   *
   * `createOrder` gán `provider: "payos"` NGAY lúc tạo đơn, trước khi
   * `ensurePayosCheckout` gọi sang PayOS, nên chỉ đọc `provider` là mọi đường
   * hủy đều trả giá cho một lượt gọi mạng chắc chắn trả về 404 — kể cả đường
   * rollback chốt giá, chạy ngay giữa lúc học viên đang chờ. Tệ hơn: PayOS chập
   * lúc đó thành `gateway_unavailable`, và một đơn chưa từng có link bị giữ
   * nguyên cùng với ghế, credits và suất giảm giá của chính người mua.
   *
   * Hai cột này chỉ được ghi sau khi PayOS đã nhận đơn (`ensurePayosCheckout`
   * lưu `providerRef` cả ở nhánh khôi phục khi response bị mất), nên cả hai còn
   * null là bằng chứng đủ mạnh rằng không có link nào tồn tại.
   */
  const hasRemoteLink = order.providerRef !== null || order.checkoutUrl !== null;

  if (order.provider === "payos" && hasRemoteLink) {
    try {
      let remote = await payosClient().paymentRequests.get(order.code);
      if (PAYOS_MONEY_STATES.has(remote.status)) {
        return {
          cancelled: false as const,
          released: 0,
          reason: "payment_in_progress" as const,
        };
      }
      if (remote.status === "PENDING") {
        remote = await payosClient().paymentRequests.cancel(
          order.code,
          options.as === "expired" ? "Hết thời gian giữ chỗ" : "Học viên hủy đơn",
        );
      }
      if (PAYOS_MONEY_STATES.has(remote.status) || remote.status === "PENDING") {
        return {
          cancelled: false as const,
          released: 0,
          reason: "payment_in_progress" as const,
        };
      }
    } catch (error) {
      if (!isPayosNotFound(error)) {
        console.error(`[payos] Không thể đóng link đơn #${order.code}:`, error);
        return {
          cancelled: false as const,
          released: 0,
          reason: "gateway_unavailable" as const,
        };
      }
      // Not found by the globally unique order code confirms there is no remote
      // link capable of accepting money.
    }
  }

  return cancelOrderLocally(order.id, options);
}

/**
 * Trạng thái link PayOS mà HDI coi là "đã chết, không còn nhận được tiền".
 *
 * `FAILED` và `EXPIRED` đi cùng `expired` chứ không `cancelled`: không ai từ
 * chối đơn cả, nó chỉ hết đường sống. Chỉ `CANCELLED` mới là một quyết định của
 * con người, và `OrderStatus` đã cố ý tách hai thứ đó ra.
 */
export const PAYOS_DEAD_STATES: Record<string, "cancelled" | "expired"> = {
  CANCELLED: "cancelled",
  EXPIRED: "expired",
  FAILED: "expired",
};

/**
 * Hỏi PayOS xem một đơn còn sống thật không, rồi đóng nó nếu không.
 *
 * PayOS KHÔNG gửi webhook cho việc hủy — mọi sự kiện nó gửi đều là sự kiện tiền
 * (xem `classifyPayosPayment`). Nên nếu học viên bấm "Hủy" trên trang PayOS rồi
 * đóng tab trước khi redirect kịp chạy, hoặc app ngân hàng nuốt mất deep link,
 * thì phía HDI không có gì báo và đơn giữ ghế tới tận lượt cron 03:00. Hàm này
 * là đường đi ngược lại: HDI chủ động hỏi.
 *
 * CHỈ ĐỌC, không bao giờ gọi `paymentRequests.cancel`. Đó là khác biệt quan
 * trọng với `cancelOrder`: vì nó không tạo ra thay đổi nào ở PayOS, nó gọi được
 * từ những chỗ mà một lệnh hủy sẽ là CSRF — kể cả khi `orderCode` bị đoán ra,
 * kết quả tệ nhất là HDI đồng bộ đúng một sự thật đã có sẵn ngoài kia.
 *
 * Trạng thái có tiền (`PAID`/`PROCESSING`/`UNDERPAID`) và `PENDING` đều không bị
 * đụng tới: webhook là chủ của nhóm đầu, và nhóm sau nghĩa là link vẫn sống.
 */
export async function syncPayosOrderStatus(
  orderId: string,
  options: { userId?: string } = {},
) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      status: "pending",
      ...(options.userId ? { userId: options.userId } : {}),
    },
    select: { id: true, code: true, provider: true, providerRef: true, checkoutUrl: true },
  });
  // Cùng lý lẽ với `cancelOrder`: hai cột này còn null là bằng chứng không có
  // link nào ngoài kia để mà hỏi.
  if (!order || order.provider !== "payos") return { closed: false as const };
  if (order.providerRef === null && order.checkoutUrl === null) {
    return { closed: false as const };
  }

  let remote;
  try {
    remote = await payosClient().paymentRequests.get(order.code);
  } catch (error) {
    // Không tìm thấy KHÔNG được hiểu là đã hủy ở đây, khác với `cancelOrder`:
    // ở đó người dùng vừa yêu cầu đóng đơn nên trả chỗ là làm đúng ý họ, còn ở
    // đây không ai yêu cầu gì cả và một lỗi tra cứu không phải là bằng chứng.
    if (!isPayosNotFound(error)) {
      console.error(`[payos] Không đọc được trạng thái đơn #${order.code}:`, error);
    }
    return { closed: false as const };
  }

  const as = PAYOS_DEAD_STATES[remote.status];
  if (!as) return { closed: false as const };

  const result = await cancelOrderLocally(order.id, { ...options, as });
  return result.cancelled
    ? { closed: true as const, as, released: result.released }
    : { closed: false as const };
}

/**
 * Đóng một danh sách đơn quá hạn, dừng lại khi hết ngân sách thời gian.
 *
 * Mỗi lượt `cancelOrder` có thể là hai lượt gọi PayOS, và client được cấu hình
 * `timeout: 10_000, maxRetries: 1` — tức tối đa ~20 giây cho MỘT đơn. Không có
 * trần thì một chồng đơn bị bỏ dở đủ để làm treo chính cái request đang cố dọn
 * chúng. Phần chưa dọn hết không mất đi đâu: lượt sau, hoặc cron, sẽ nhặt tiếp
 * theo đúng thứ tự `expiresAt`.
 */
async function closeStaleOrders(
  orderIds: string[],
  budgetMs: number,
) {
  const deadline = Date.now() + budgetMs;
  let expired = 0;
  let released = 0;
  let scanned = 0;
  for (const id of orderIds) {
    if (Date.now() >= deadline) break;
    scanned += 1;
    const result = await cancelOrder(id, { as: "expired" });
    if (result.cancelled) {
      expired += 1;
      released += result.released;
    }
  }
  return { scanned, expired, released };
}

/** Đơn quá hạn đang giữ ghế của những khóa sắp được đặt. */
async function reconcileStaleOrdersForCourses(courseIds: string[], now = new Date()) {
  if (courseIds.length === 0) return;
  const candidates = await prisma.order.findMany({
    where: {
      status: "pending",
      expiresAt: { lte: now },
      items: { some: { courseId: { in: courseIds } } },
    },
    select: { id: true },
    orderBy: { expiresAt: "asc" },
    take: 5,
  });
  await closeStaleOrders(
    candidates.map((order) => order.id),
    5_000,
  );
}

/**
 * Đơn quá hạn của CHÍNH người sắp đặt đơn.
 *
 * Bản theo khóa ở trên không thay được hàm này, dù chúng trông giống nhau: nó
 * lọc theo khóa trong giỏ, còn credits và ưu đãi "đơn đầu tiên" thì thuộc về
 * NGƯỜI. Bỏ dở một lần checkout rồi quay lại với một khóa khác là đơn cũ không
 * nằm trong tầm của bản theo khóa — và chừng nào nó chưa đóng, `claimed` vẫn
 * đọc nó là "đã dùng ưu đãi" còn dòng `reserved` trong sổ vẫn trừ vào số dư.
 * Trước đây chỉ cron hằng ngày mới gỡ, tức học viên mất tiền thưởng của mình
 * tới 24 giờ trên một tài khoản Vercel Hobby.
 */
export async function reconcileStaleOrdersForPayer(
  userId: string,
  now = new Date(),
) {
  const candidates = await prisma.order.findMany({
    where: { userId, status: "pending", expiresAt: { lte: now } },
    select: { id: true },
    orderBy: { expiresAt: "asc" },
    take: 5,
  });
  if (candidates.length === 0) return { scanned: 0, expired: 0, released: 0 };
  return closeStaleOrders(
    candidates.map((order) => order.id),
    5_000,
  );
}

/**
 * Hỏi PayOS về đơn CHƯA quá hạn của chính người này, rồi đóng những đơn đã chết.
 *
 * `reconcileStaleOrdersForPayer` ở trên chỉ nhặt `expiresAt <= now`, nên nó
 * không chạm được vào trường hợp thường gặp nhất: học viên bấm "Hủy" trên trang
 * PayOS rồi đóng tab trước khi redirect kịp chạy, hoặc app ngân hàng nuốt mất
 * deep link. PayOS KHÔNG gửi webhook cho việc hủy, nên phía HDI đơn vẫn đọc là
 * `pending` và giữ ghế suốt `ORDER_TTL_HOURS` — và trong quãng đó chính người
 * mua bị `already_enrolled` chặn khỏi khóa của mình.
 *
 * CHỈ ĐỌC ở phía PayOS: `syncPayosOrderStatus` không bao giờ gọi
 * `paymentRequests.cancel`, và nó bỏ qua mọi trạng thái còn sống hoặc đang giữ
 * tiền. Một đơn thật sự đang chờ chuyển khoản không bị đụng tới.
 *
 * `take: 2` và ngân sách thời gian là có chủ đích: hàm này nằm trên đường mở giỏ
 * hàng, nên nó phải rẻ. Đơn không kịp quét lượt này sẽ được quét ở lượt sau,
 * hoặc bởi `<CheckoutReclaim />`, hoặc bởi cron.
 */
export async function syncLiveOrdersForPayer(
  userId: string,
  now = new Date(),
  budgetMs = 4_000,
) {
  const candidates = await prisma.order.findMany({
    where: {
      userId,
      status: "pending",
      expiresAt: { gt: now },
      provider: "payos",
      // Cùng bằng chứng mà `syncPayosOrderStatus` dùng để biết có link ngoài kia
      // hay không — lọc sẵn ở đây để không tốn một vòng truy vấn cho đơn chưa
      // từng chạm tới PayOS.
      OR: [{ providerRef: { not: null } }, { checkoutUrl: { not: null } }],
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
    take: 2,
  });

  const deadline = Date.now() + budgetMs;
  let closed = 0;
  for (const order of candidates) {
    if (Date.now() >= deadline) break;
    const result = await syncPayosOrderStatus(order.id, { userId });
    if (result.closed) closed += 1;
  }
  return { scanned: candidates.length, closed };
}

/**
 * Release the seats held by orders nobody ever paid for.
 *
 * Called by the daily cron. Written as a loop over cancelOrder rather than one
 * bulk update so that each order's seats are released in the same transaction
 * that closes it.
 */
export async function expireStaleOrders(now = new Date(), budgetMs = 40_000) {
  const stale = await prisma.order.findMany({
    where: { status: "pending", expiresAt: { lt: now } },
    select: { id: true },
    orderBy: { expiresAt: "asc" },
    // Trần theo THỜI GIAN chứ không theo số đơn. Con số cứng 20 cũ là một hạn
    // ngạch mỗi ngày, vì cron trên Vercel Hobby chỉ chạy được một lần mỗi ngày:
    // ngày nào có hơn 20 đơn bị bỏ dở là tồn đọng lớn dần mà không có gì báo.
    // Sau khi `cancelOrder` bỏ được lượt gọi PayOS cho đơn chưa có link, phần
    // lớn đơn ở đây đóng được bằng một transaction thuần database.
    take: 200,
  });

  return closeStaleOrders(
    stale.map((order) => order.id),
    budgetMs,
  );
}
