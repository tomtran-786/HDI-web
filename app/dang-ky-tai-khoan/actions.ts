"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { registrationSchema } from "@/lib/auth-input";
import { allowAuthEmail, serverActionIp } from "@/lib/auth-throttle";
import { createAuthToken, VERIFY_TOKEN_TTL_MS } from "@/lib/auth-tokens";
import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
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
   * Một email đã có tài khoản thì dừng ở đây, không đi tiếp.
   *
   * Nhánh cũ nhận đăng ký lại cho tài khoản chưa xác thực và chỉ gửi lại thư,
   * lặng lẽ bỏ qua mật khẩu vừa nhập. Người dùng thấy "đã gửi thư", bấm xác
   * thực, rồi không đăng nhập được bằng mật khẩu họ vừa đặt — vì mật khẩu thật
   * vẫn là của lần đăng ký đầu. Ghi đè mật khẩu ở đây thì lại mở đường chiếm
   * tài khoản: kẻ khác đăng ký chèn lên một địa chỉ đang chờ xác thực, chủ hộp
   * thư bấm liên kết trong thư của chính mình, và tài khoản thành đã xác thực
   * với mật khẩu của kẻ đó. Nên đúng cách là từ chối và nói rõ lý do.
   */
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { emailVerified: true },
  });
  if (existing) {
    const reason = existing.emailVerified ? "taken" : "pending";
    redirect(`${REGISTER}?error=${reason}${nextSuffix}`);
  }

  let recipient: { id: string; email: string; name: string } | null = null;
  let token: string | null = null;

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, passwordHash },
        select: { id: true, email: true, name: true },
      });
      const createdToken = await createAuthToken(tx, {
        userId: user.id,
        purpose: "verify",
        ttlMs: VERIFY_TOKEN_TTL_MS,
      });
      return { user, token: createdToken.token };
    });
    recipient = { ...created.user, name: created.user.name ?? created.user.email };
    token = created.token;
  } catch (error) {
    // Thua cuộc đua với một lượt đăng ký song song cho cùng địa chỉ. Hàng vừa
    // được tạo nên nó chắc chắn chưa xác thực — "pending" mới là mô tả đúng.
    if ((error as { code?: string }).code === "P2002") {
      redirect(`${REGISTER}?error=pending${nextSuffix}`);
    }
    console.error("[register] Không tạo được tài khoản:", error);
  }

  if (recipient && token) {
    await sendVerificationEmail({
      to: recipient.email,
      name: recipient.name,
      token,
      ...(next !== "/tai-khoan" ? { next } : {}),
    }).catch((error) => console.error("[register] Không gửi được email:", error));
  }

  redirect(`${REGISTER}?sent=1${nextSuffix}`);
}
