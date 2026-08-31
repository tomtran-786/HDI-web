import { randomInt } from "node:crypto";
import type { Prisma } from "./generated/prisma/client";
import { prisma } from "./prisma";

export type ReferralDb = typeof prisma | Prisma.TransactionClient;

/**
 * Bỏ 0, O, 1, I và L.
 *
 * Mã này được đọc qua điện thoại và chép tay từ ảnh chụp màn hình, nên hai ký
 * tự trông giống nhau không phải chuyện thẩm mỹ: người nhập nhầm một ký tự sẽ
 * gặp "mã không tồn tại" và bỏ cuộc, còn người giới thiệu thì không bao giờ
 * biết mình vừa mất một lượt.
 */
export const REFERRAL_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** 31^8 ≈ 8,5×10^11 — đủ thưa để dò mã người khác là vô vọng. */
export const REFERRAL_CODE_LENGTH = 8;

/** Bằng đúng độ rộng cột `users.referral_code`. */
const MAX_INPUT_LENGTH = 12;

/**
 * `randomInt` của node:crypto chứ không phải `Math.random`.
 *
 * Mã là công khai theo thiết kế, nhưng nó cũng là thứ duy nhất gắn một tài
 * khoản mới vào một người giới thiệu — một bộ sinh dự đoán được cho phép đoán
 * ra mã của người khác và gán hoa hồng sai chỗ.
 */
export function generateReferralCode(): string {
  let out = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i += 1) {
    out += REFERRAL_CODE_ALPHABET[randomInt(REFERRAL_CODE_ALPHABET.length)];
  }
  return out;
}

/**
 * Chuẩn hóa mã người dùng gõ vào trước khi tra database.
 *
 * Trả chuỗi rỗng cho mọi thứ không dùng được, để nơi gọi chỉ phải phân biệt
 * "có khai mã" với "không khai mã".
 */
export function normalizeReferralCode(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().toUpperCase().slice(0, MAX_INPUT_LENGTH);
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

const MAX_ATTEMPTS = 5;

/**
 * Mã của một người, cấp lười ở lần đầu họ cần tới.
 *
 * `updateMany` với điều kiện `referralCode: null` chứ không phải `update`: hai
 * request đồng thời của cùng một người (mở hai tab trang giới thiệu) sẽ cùng
 * thấy chưa có mã và cùng ghi. Với `update` thì mã sau đè mã trước — và mã đầu
 * có thể đã kịp được gửi cho bạn bè, nên nó im lặng trở thành mã chết.
 *
 * Vòng lặp bắt P2002 lo một chuyện khác hẳn: mã vừa sinh trùng mã của NGƯỜI
 * KHÁC. Trả `null` thay vì ném, vì không cấp được mã không được phép làm hỏng
 * trang mà người dùng đang mở.
 */
export async function ensureReferralCode(
  db: ReferralDb,
  userId: string,
): Promise<string | null> {
  const existing = await db.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (!existing) return null;
  if (existing.referralCode) return existing.referralCode;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const code = generateReferralCode();
    try {
      const written = await db.user.updateMany({
        where: { id: userId, referralCode: null },
        data: { referralCode: code },
      });
      if (written.count > 0) return code;

      // Thua cuộc đua với chính mình ở tab kia: đọc lại mã bên đó vừa ghi.
      const current = await db.user.findUnique({
        where: { id: userId },
        select: { referralCode: true },
      });
      return current?.referralCode ?? null;
    } catch (error) {
      if (!isUniqueViolation(error)) {
        console.error(`[referral] Không cấp được mã cho user=${userId}:`, error);
        return null;
      }
      // Trùng mã người khác — thử mã khác.
    }
  }

  console.error(
    `[referral] Không sinh được mã duy nhất cho user=${userId} sau ${MAX_ATTEMPTS} lần thử.`,
  );
  return null;
}
