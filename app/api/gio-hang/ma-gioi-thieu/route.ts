import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { currentProfile } from "@/lib/current-profile";
import { isProfileComplete } from "@/lib/profile";
import { normalizeReferralCode } from "@/lib/referral-code";
import { resolveReferralCode } from "@/lib/referral-resolve";

/**
 * Kiểm một mã giới thiệu, KHÔNG ghi gì — nuôi nút "Áp dụng" ở giỏ hàng.
 *
 * Trả `{ ok: true }` hoặc `{ ok: false, reason }` với `reason` là `unknown`,
 * `self` hay `throttled` (kèm HTTP 200 / 429 theo ngữ nghĩa bên dưới). Kết quả
 * chỉ để giỏ hàng bật khoản giảm trên con số hiển thị: server action `checkout`
 * vẫn tra mã lại từ đầu, và `createOrder` mới là nơi ghi người giới thiệu và
 * tính tiền (BR-02). Vì vậy endpoint này không bao giờ là căn cứ của một hóa đơn.
 *
 * Không trả về người giới thiệu là ai, chỉ "có" hoặc "không": cùng mức lộ thông
 * tin với việc gõ mã vào `checkout`, và chung hạn mức `referral_code` với nó.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "auth_required" }, { status: 401, headers: noStore });
  }

  const user = await currentProfile(session.user.id);
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401, headers: noStore });
  }
  if (!isProfileComplete(user)) {
    return NextResponse.json({ error: "profile_required" }, { status: 409, headers: noStore });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400, headers: noStore });
  }

  // Ô trống không phải mã sai: không tra, không tiêu hạn mức.
  const code = normalizeReferralCode((body as { code?: unknown } | null)?.code);
  if (!code) {
    return NextResponse.json(
      { ok: false, reason: "unknown" },
      { status: 200, headers: noStore },
    );
  }

  const resolved = await resolveReferralCode(session.user.id, code);
  if (!resolved.ok) {
    return NextResponse.json(
      { ok: false, reason: resolved.reason },
      { status: resolved.reason === "throttled" ? 429 : 200, headers: noStore },
    );
  }
  return NextResponse.json({ ok: true }, { headers: noStore });
}
