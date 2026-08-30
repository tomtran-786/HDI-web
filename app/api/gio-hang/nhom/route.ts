import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { allowUserAction } from "@/lib/auth-throttle";
import { loadCart, readCartIds } from "@/lib/cart";
import { currentProfile } from "@/lib/current-profile";
import { normalizeMemberEmails, resolveGroupMembers } from "@/lib/group-members";
import { GROUP_MIN_SIZE, seatPriceVnd } from "@/lib/group-pricing";
import { isProfileComplete } from "@/lib/profile";
import { prisma } from "@/lib/prisma";

/**
 * Báo giá thử cho một nhóm, KHÔNG ghi gì.
 *
 * Tồn tại để giỏ hàng hiện đúng con số trước khi ai bấm thanh toán: giá nhóm
 * phụ thuộc số người, mà số người chỉ biết được sau khi tra email ra tài khoản.
 * Server action `checkout` vẫn phân giải và tính lại toàn bộ từ đầu — endpoint
 * này không bao giờ là căn cứ của một hóa đơn (BR-02).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "auth_required" }, { status: 401, headers: noStore });
  }

  const user = await currentProfile(session.user.id);
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401, headers: noStore });
  }
  if (!isProfileComplete(user)) {
    return NextResponse.json({ error: "profile_required" }, { status: 409, headers: noStore });
  }

  // Endpoint này nhận email tùy ý rồi nói có tài khoản hay không. Nó không trả
  // về tên ai, nhưng vẫn là một cách dò từng email một — rate limit là hàng rào
  // duy nhất giữa nó và việc quét cả một danh sách.
  if (!(await allowUserAction("group-preview", session.user.id, 60))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: noStore });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400, headers: noStore });
  }

  const emails = (body as { emails?: unknown })?.emails;
  const normalized = normalizeMemberEmails(emails, session.user.email);
  if (!normalized.ok) {
    return NextResponse.json(
      { error: "invalid_emails", message: normalized.message },
      { status: 400, headers: noStore },
    );
  }

  const { members, unregistered } = await resolveGroupMembers(normalized.emails);
  const groupSize = members.length + 1;

  const cart = await loadCart(await readCartIds(), session.user.id, groupSize);
  const buyable = cart.selected.filter((course) => course.availability === "buyable");

  // Thành viên đã có quyền hoặc đơn chờ cho một khóa trong giỏ sẽ làm cả đơn bị
  // từ chối ở `createOrder`. Nói trước ở đây, kèm tên đích danh, thì nhóm trưởng
  // sửa được ngay thay vì gặp một lỗi chung chung sau khi bấm thanh toán.
  const courseIds = buyable.flatMap((course) => (course.id ? [course.id] : []));
  const clashes =
    members.length > 0 && courseIds.length > 0
      ? await prisma.enrollment.findMany({
          where: {
            userId: { in: members.map((member) => member.id) },
            courseId: { in: courseIds },
            OR: [{ status: "pending" }, { status: "paid", accessRevokedAt: null }],
          },
          select: { userId: true },
        })
      : [];
  const clashing = new Set(clashes.map((row) => row.userId));

  return NextResponse.json(
    {
      groupSize,
      minSize: GROUP_MIN_SIZE,
      discountApplies: groupSize >= GROUP_MIN_SIZE,
      members: [
        ...members.map((member) => ({
          email: member.email,
          registered: true,
          conflict: clashing.has(member.id),
        })),
        ...unregistered.map((email) => ({ email, registered: false, conflict: false })),
      ],
      lines: buyable.map((course) => ({
        courseId: course.id,
        code: course.code,
        title: course.title,
        listVnd: course.priceVnd,
        unitVnd: seatPriceVnd(course, groupSize),
      })),
      totalVnd: cart.totalVnd,
      blocked: unregistered.length > 0 || clashing.size > 0,
    },
    { headers: noStore },
  );
}
