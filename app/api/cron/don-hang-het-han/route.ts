import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { expireStaleOrders } from "@/lib/orders";
import { expireStaleServiceOrders } from "@/lib/service-orders";
import { pruneAuthThrottles } from "@/lib/auth-throttle";
import { pruneExpiredAuthTokens } from "@/lib/auth-tokens";
import { pruneExpiredLeases } from "@/lib/external-lease";
import {
  reconcileMissingDriveGrants,
  revokeExpiredDriveAccess,
} from "@/lib/fulfillment";
import { COURSES_TAG } from "@/lib/cache-tags";

// Prisma, PayOS and Google SDKs need Node, not the edge runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const result = await expireStaleOrders();
  // Permission mutations for one folder must not run concurrently. Keep grant
  // then revoke deterministic even though each operation also has a DB lease.
  const driveGrants = await reconcileMissingDriveGrants();
  const driveRevokes = await revokeExpiredDriveAccess();
  // Đơn dịch vụ không giữ chỗ của ai nên nó không cần đứng chung hàng với hai
  // bước Drive ở trên; nó chỉ là một lượt dọn trạng thái, chạy song song được.
  const [services, throttles, tokens, leases] = await Promise.all([
    expireStaleServiceOrders(),
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
    driveGrants,
    driveRevokes,
    pruned: { throttles, tokens, leases },
  });
}
