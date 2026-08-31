"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { registrationSchema } from "@/lib/auth-input";
import { allowAuthEmail, serverActionIp } from "@/lib/auth-throttle";
import { createAuthToken, VERIFY_TOKEN_TTL_MS } from "@/lib/auth-tokens";
import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { normalizeReferralCode } from "@/lib/referral-code";
import { safeNext } from "@/lib/safe-path";

const REGISTER = "/dang-ky-tai-khoan";

export async function registerAccount(formData: FormData) {
  const next = safeNext(formData.get("tiep"));
  const nextSuffix =
    next === "/tai-khoan" ? "" : `&tiep=${encodeURIComponent(next)}`;
  const parsed = registrationSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) redirect(`${REGISTER}?error=invalid${nextSuffix}`);

  const { name, email, password } = parsed.data;
  const ip = await serverActionIp();
  if (!(await allowAuthEmail("register", email, ip))) {
    redirect(`${REGISTER}?error=throttled${nextSuffix}`);
  }

  /**
   * Mã giới thiệu là tùy chọn, nhưng mã SAI thì báo lỗi rõ chứ không bỏ qua.
   *
   * Bỏ qua im lặng là cách chắc chắn nhất để cả hai bên cùng mất phần mà không
   * ai biết: người mới mất khoản giảm 10% của đơn đầu tiên, người giới thiệu
   * mất hoa hồng, và quan hệ này chỉ gắn được đúng một lần lúc xác thực nên
   * không có đường sửa lại về sau.
   *
   * Tra ở đây chứ không đợi tới lúc xác thực: người vừa gõ mã là người duy nhất
   * sửa được nó.
   */
  let referrerId: string | null = null;
  const referralCode = normalizeReferralCode(formData.get("maGioiThieu"));
  if (referralCode) {
    const referrer = await prisma.user.findUnique({
      where: { referralCode },
      select: { id: true },
    });
    if (!referrer) redirect(`${REGISTER}?error=ma_gioi_thieu${nextSuffix}`);
    referrerId = referrer.id;
  }

  /**
   * Mật khẩu đi theo token xác thực, không nằm sẵn trên tài khoản.
   *
   * `users.password_hash` từng được ghi ngay lúc đăng ký, trước khi có ai chứng
   * minh sở hữu hộp thư. Kẻ đăng ký chèn địa chỉ của người khác đặt được mật
   * khẩu, rồi chính chủ hộp thư bấm liên kết xác thực và kích hoạt tài khoản với
   * mật khẩu của kẻ đó. Giờ hash nằm trên hàng token, và `verifyEmail` chỉ áp
   * hash của đúng token vừa được bấm.
   *
   * Nhờ vậy đăng ký lại một địa chỉ CHƯA xác thực là an toàn và được cho phép:
   * `createAuthToken` xoá token cũ, nên chỉ liên kết mới nhất còn sống và mật
   * khẩu có hiệu lực luôn là mật khẩu vừa nhập. Địa chỉ ĐÃ xác thực thì không —
   * ở đó việc đăng ký lại chỉ có thể là nhầm lẫn hoặc dò tài khoản.
   */
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, emailVerified: true },
  });
  if (existing?.emailVerified) {
    redirect(`${REGISTER}?error=taken${nextSuffix}`);
  }

  let recipient: { email: string; name: string } | null = null;
  let token: string | null = null;

  try {
    if (existing) {
      const created = await createAuthToken(prisma, {
        userId: existing.id,
        purpose: "verify",
        ttlMs: VERIFY_TOKEN_TTL_MS,
        pendingPasswordHash: passwordHash,
        pendingReferrerId: referrerId,
      });
      recipient = {
        email: existing.email,
        name: existing.name ?? existing.email,
      };
      token = created.token;
    } else {
      const created = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { name, email },
          select: { id: true, email: true, name: true },
        });
        const createdToken = await createAuthToken(tx, {
          userId: user.id,
          purpose: "verify",
          ttlMs: VERIFY_TOKEN_TTL_MS,
          pendingPasswordHash: passwordHash,
          pendingReferrerId: referrerId,
        });
        return { user, token: createdToken.token };
      });
      recipient = {
        email: created.user.email,
        name: created.user.name ?? created.user.email,
      };
      token = created.token;
    }
  } catch (error) {
    // Thua cuộc đua với một lượt đăng ký song song cho cùng địa chỉ. Hàng vừa
    // được tạo nên nó chưa xác thực, và nhánh trên đã xử lý đúng trường hợp đó —
    // nhưng lặp lại ở đây chỉ để chiều một cuộc đua hiếm thì không đáng, nên báo
    // lỗi tạm thời và mời thử lại.
    console.error("[register] Không tạo được tài khoản:", error);
    redirect(`${REGISTER}?error=failed${nextSuffix}`);
  }

  /**
   * Kết quả gửi thư phải được đọc, không được vứt đi.
   *
   * `sendEmail` báo Resend từ chối bằng `{ sent: false }` chứ không throw, nên
   * một `.catch()` đơn thuần không bao giờ chạy — đúng cách mà một `EMAIL_FROM`
   * sai từng làm mọi thư xác thực biến mất trong khi trang vẫn hiện "Kiểm tra
   * hộp thư của bạn". Vẫn bọc try/catch vì `sendVerificationEmail` gọi `appUrl()`
   * và hàm đó ném lỗi khi thiếu `APP_URL` ở production.
   */
  let delivered = false;
  if (recipient && token) {
    try {
      const result = await sendVerificationEmail({
        to: recipient.email,
        name: recipient.name,
        token,
        ...(next !== "/tai-khoan" ? { next } : {}),
      });
      delivered = result.sent;
    } catch (error) {
      console.error("[register] Không gửi được email:", error);
    }
  }

  // Tài khoản và token đã tồn tại rồi, nên đây không phải "đăng ký hỏng" — nó
  // chỉ thiếu lá thư. Thông điệp đi kèm chỉ sang đường gửi lại liên kết, vì
  // đăng ký lại còn tiêu thêm một trong ba lượt mỗi giờ của `allowAuthEmail`.
  if (!delivered) redirect(`${REGISTER}?error=email_failed${nextSuffix}`);

  redirect(`${REGISTER}?sent=1${nextSuffix}`);
}
