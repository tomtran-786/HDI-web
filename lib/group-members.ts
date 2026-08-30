import { z } from "zod";
import { MAX_MEMBERS } from "./group-invite";
import { normalizeEmail } from "./normalize-email";
import { prisma } from "./prisma";

/**
 * Biến danh sách email nhóm trưởng gõ vào thành danh sách người học có thật.
 *
 * Thành viên BẮT BUỘC phải có sẵn tài khoản. Không phải để làm khó người mua:
 * partial unique index `enrollments_user_id_course_id_active_key` đòi mỗi ghế
 * một `user_id` thật, và hồ sơ học viên có những trường (số điện thoại, giai
 * đoạn nghiên cứu) mà một tài khoản tự sinh không thể điền hộ.
 */

const memberEmail = z.string().trim().email();

export type NormalizedEmails =
  | { ok: true; emails: string[] }
  | { ok: false; message: string };

/**
 * Chuẩn hóa, khử trùng lặp và kiểm định danh sách email.
 *
 * Bỏ im lặng email của chính nhóm trưởng: họ đã là một ghế trong nhóm, và tự gõ
 * email mình vào là nhầm lẫn dễ hiểu chứ không phải lỗi đáng chặn.
 */
export function normalizeMemberEmails(
  raw: unknown,
  leaderEmail: string,
): NormalizedEmails {
  if (!Array.isArray(raw)) return { ok: true, emails: [] };

  const leader = normalizeEmail(leaderEmail);
  const seen = new Set<string>();
  const emails: string[] = [];

  for (const value of raw) {
    if (typeof value !== "string" || value.trim() === "") continue;
    const parsed = memberEmail.safeParse(value);
    if (!parsed.success) {
      return { ok: false, message: `"${value.trim()}" không phải email hợp lệ.` };
    }
    const email = normalizeEmail(parsed.data);
    if (email === leader || seen.has(email)) continue;
    seen.add(email);
    emails.push(email);
  }

  if (emails.length > MAX_MEMBERS) {
    return {
      ok: false,
      message: `Một nhóm tối đa ${MAX_MEMBERS + 1} người, tức nhiều nhất ${MAX_MEMBERS} bạn ngoài bạn.`,
    };
  }

  return { ok: true, emails };
}

export type ResolvedMember = { id: string; email: string };

/**
 * Tra email ra tài khoản đã xác thực.
 *
 * CỐ Ý không trả về tên. Endpoint này nhận email tùy ý rồi nói có tài khoản hay
 * không — trả kèm tên thật biến nó thành máy tra cứu danh tính. Nhóm trưởng tự
 * gõ những email này nên họ đã biết mình đang mời ai.
 *
 * Tài khoản chưa xác thực email bị xếp cùng `unregistered`: ghi danh sẽ cấp
 * quyền Google Drive vào chính địa chỉ đó, và một tài khoản chưa xác thực có
 * thể đang chiếm email của người khác.
 */
export async function resolveGroupMembers(
  emails: string[],
  db = prisma,
): Promise<{ members: ResolvedMember[]; unregistered: string[] }> {
  if (emails.length === 0) return { members: [], unregistered: [] };

  const found = await db.user.findMany({
    where: { email: { in: emails }, emailVerified: { not: null } },
    select: { id: true, email: true },
  });

  const byEmail = new Map(found.map((user) => [normalizeEmail(user.email), user]));
  const members: ResolvedMember[] = [];
  const unregistered: string[] = [];

  // Duyệt theo thứ tự nhóm trưởng gõ, để thông báo lỗi nêu đúng email họ nhìn thấy.
  for (const email of emails) {
    const user = byEmail.get(email);
    if (user) members.push({ id: user.id, email });
    else unregistered.push(email);
  }

  return { members, unregistered };
}
