import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { expireStaleOrders } from "@/lib/orders";
import { expireStaleServiceOrders } from "@/lib/service-orders";
import { pruneAuthThrottles } from "@/lib/auth-throttle";
import { pruneExpiredAuthTokens } from "@/lib/auth-tokens";
import { pruneExpiredLeases } from "@/lib/external-lease";
import { repairReferralReservations } from "@/lib/referral-ledger";
import {
  reconcileMissingDriveGrants,
  revokeExpiredDriveAccess,
} from "@/lib/fulfillment";
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
const ORDER_EXPIRY_BUDGET_MS = 25_000;

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
  const [services, referralRepairs, throttles, tokens, leases] = await Promise.all([
    expireStaleServiceOrders(),
    repairReferralReservations(),
    pruneAuthThrottles(),
    pruneExpiredAuthTokens(),
    pruneExpiredLeases(),
  ]);
  if (result.released > 0 || driveRevokes.revoked > 0 || driveRevokes.kept > 0) {
    revalidateTag(COURSES_TAG, { expire: 0 });
  }
  if (result.expired > 0) {
    console.log(
      `[cron] Đóng ${result.expired} đơn quá hạn, trả lại ${result.released} chỗ.`,
    );
  }
  return NextResponse.json({
    ok: true,
    orders: result,
    services,
    referralRepairs,
    driveGrants,
    driveRevokes,
    pruned: { throttles, tokens, leases },
  });
}
