import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { expireStaleOrders } from "@/lib/orders";
import { expireStaleServiceOrders } from "@/lib/service-orders";
import { pruneAuthThrottles } from "@/lib/auth-throttle";
import { pruneExpiredAuthTokens } from "@/lib/auth-tokens";
import { pruneExpiredLeases } from "@/lib/external-lease";
import { expireCredits, repairReferralReservations } from "@/lib/referral-ledger";
import {
  reconcileMissingDriveGrants,
  revokeExpiredDriveAccess,
} from "@/lib/fulfillment";
import {
  checkPayosWebhookHealth,
  reconcilePaidPayosOrders,
  reconcilePaidPayosServiceOrders,
} from "@/lib/payos-reconcile";
import { COURSES_TAG } from "@/lib/cache-tags";

// Prisma, PayOS and Google SDKs need Node, not the edge runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/**
 * Lượt cron này đóng đơn quá hạn (mỗi đơn có thể là hai lượt gọi PayOS), rồi
 * cấp bù và thu hồi quyền Google Drive theo lô. Đó là hàng chục lượt gọi ra
 * ngoài mạng trong một request, và mặc định của Vercel không đủ cho chúng —
 * hết giờ ở đây nghĩa là phần việc sau cùng lặng lẽ không bao giờ chạy.
 */
export const maxDuration = 60;

/**
 * Ngân sách cho bước đóng đơn, chừa chỗ cho hai bước Drive phía sau.
 *
 * Trước đây bước này bị chặn bằng một con số cứng 20 đơn mỗi lượt. Vì tài khoản
 * Vercel Hobby chỉ chạy được một lượt cron mỗi ngày, đó thực chất là hạn ngạch
 * 20 đơn/ngày: ngày nào có nhiều đơn bị bỏ dở hơn thế là tồn đọng lớn dần mà
 * không có gì báo. Trần theo thời gian thì tự co giãn — đơn chưa từng có link
 * PayOS nay đóng được bằng một transaction thuần database, nên một lượt xử lý
 * được nhiều hơn hẳn.
 */
const ORDER_EXPIRY_BUDGET_MS = 20_000;

/**
 * Ngân sách cho bước đối soát-kéo chạy TRƯỚC khi đóng đơn. Cùng lý lẽ trần thời
 * gian như trên: mỗi đơn là một `paymentRequests.get` (~tối đa 20s khi PayOS
 * chậm). 15s + 8s + 20s (đóng đơn) + hai bước Drive vẫn nằm dưới `maxDuration`.
 */
const RECONCILE_PAID_BUDGET_MS = 15_000;
const RECONCILE_PAID_SERVICE_BUDGET_MS = 8_000;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const offered = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  // Compare in constant time. A `!==` on a bearer token leaks its length and,
  // over enough requests, its prefix — cheap to avoid, tedious to discover.
  const a = Buffer.from(offered);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Release the seats held by orders nobody paid for.
 *
 * A pending order holds a place in a class. Without this, one abandoned
 * checkout takes a seat permanently and the intake looks full to everyone
 * afterwards — a failure that produces no error, no log line and no complaint,
 * only an empty chair.
 *
 * Scheduled from vercel.json. Wrong or missing credentials get a 404, not a
 * 401: there is no reason to confirm to a stranger that this route exists.
 */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Đối soát-kéo TRƯỚC khi hết hạn: một khoản tiền về muộn mà webhook không tới,
  // trên đơn sắp quá hạn, phải được xác nhận chứ không bị `expireStaleOrders`
  // quét đi. Mỗi hàm đã tự nuốt lỗi từng đơn; `.catch` ở đây là lớp cuối để một
  // sự cố ngoài dự tính không làm hỏng cả lượt cron.
  const reclaimedOrders = await reconcilePaidPayosOrders(
    new Date(),
    RECONCILE_PAID_BUDGET_MS,
  ).catch((error) => {
    console.error("[cron] reconcilePaidPayosOrders lỗi:", error);
    return { scanned: 0, confirmed: 0, review: 0 };
  });
  const reclaimedServices = await reconcilePaidPayosServiceOrders(
    new Date(),
    RECONCILE_PAID_SERVICE_BUDGET_MS,
  ).catch((error) => {
    console.error("[cron] reconcilePaidPayosServiceOrders lỗi:", error);
    return { scanned: 0, confirmed: 0, review: 0 };
  });

  const result = await expireStaleOrders(new Date(), ORDER_EXPIRY_BUDGET_MS);
  // Permission mutations for one folder must not run concurrently. Keep grant
  // then revoke deterministic even though each operation also has a DB lease.
  const driveGrants = await reconcileMissingDriveGrants();
  const driveRevokes = await revokeExpiredDriveAccess();
  // Đơn dịch vụ không giữ chỗ của ai nên nó không cần đứng chung hàng với hai
  // bước Drive ở trên; nó chỉ là một lượt dọn trạng thái, chạy song song được.
  // Khoản credits bị bỏ lửng ở `reserved` trên một đơn ĐÃ trả tiền: webhook
  // commit xong rồi chết trước khi đóng sổ (một lambda hết giờ là đủ). Không có
  // pass này thì đối soát đọc nó là "đang giữ" mãi mãi. Nó chỉ SỬA, không bao
  // giờ hoàn credits — mọi đường hủy đơn đã tự hoàn rồi.
  // Credits quá hạn sáu tháng: ghi một dòng xóa sổ bằng đúng phần chưa tiêu.
  // Chạy lại trong cùng một ngày ra 0, nên nó chịu được cả việc cron chạy hai
  // lần lẫn việc bỏ lỡ một đêm.
  const [services, referralRepairs, expiredCredits, throttles, tokens, leases] =
    await Promise.all([
      expireStaleServiceOrders(),
      repairReferralReservations(),
      expireCredits(new Date()),
      pruneAuthThrottles(),
      pruneExpiredAuthTokens(),
      pruneExpiredLeases(),
    ]);
  // Sau khi đối soát xong: nếu vẫn "im" bất thường thì webhook có thể đã chết.
  // Gọi ở đây, không trước bước đối soát, để không báo động vì chính lượt vừa
  // dọn xong.
  const webhookHealth = await checkPayosWebhookHealth(new Date()).catch((error) => {
    console.error("[cron] checkPayosWebhookHealth lỗi:", error);
    return null;
  });

  if (
    result.released > 0 ||
    reclaimedOrders.confirmed > 0 ||
    driveRevokes.revoked > 0 ||
    driveRevokes.kept > 0
  ) {
    revalidateTag(COURSES_TAG, { expire: 0 });
  }
  if (result.expired > 0) {
    console.log(
      `[cron] Đóng ${result.expired} đơn quá hạn, trả lại ${result.released} chỗ.`,
    );
  }
  if (reclaimedOrders.confirmed > 0 || reclaimedServices.confirmed > 0) {
    console.log(
      `[cron] Đối soát-kéo xác nhận ${reclaimedOrders.confirmed} đơn khóa học, ${reclaimedServices.confirmed} đơn dịch vụ.`,
    );
  }
  return NextResponse.json({
    ok: true,
    orders: result,
    reclaimedOrders,
    reclaimedServices,
    webhookHealth,
    services,
    referralRepairs,
    expiredCredits,
    driveGrants,
    driveRevokes,
    pruned: { throttles, tokens, leases },
  });
}
