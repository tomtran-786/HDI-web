"use server";

import { redirect } from "next/navigation";
import { emailSchema } from "@/lib/auth-input";
import {
  allowAuthEmail,
  allowVerifyConsume,
  serverActionIp,
} from "@/lib/auth-throttle";
import {
  authTokenIdentifier,
  consumeAuthToken,
  createAuthToken,
  pendingPasswordHashFor,
  VERIFY_TOKEN_TTL_MS,
} from "@/lib/auth-tokens";
import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { safeNext } from "@/lib/safe-path";

const VERIFY = "/xac-thuc-email";

export async function verifyEmail(formData: FormData) {
  const next = safeNext(formData.get("tiep"));
  const nextSuffix =
    next === "/tai-khoan" ? "" : `&tiep=${encodeURIComponent(next)}`;
  const token = String(formData.get("token") ?? "");
  if (!token) redirect(`${VERIFY}?error=invalid${nextSuffix}`);

  if (!(await allowVerifyConsume(await serverActionIp()))) {
    redirect(`${VERIFY}?error=invalid${nextSuffix}`);
  }

  const verified = await prisma.$transaction(async (tx) => {
    const found = await consumeAuthToken(tx, "verify", token);
    if (!found) return false;
    const user = await tx.user.updateMany({
      where: { id: found.userId, emailVerified: null },
      data: {
        emailVerified: new Date(),
        // Chỉ mật khẩu đi cùng token vừa bấm mới có hiệu lực. Token phát trước
        // migration `bind_pending_password_to_verify_token` mang NULL, nên
        // những lượt đăng ký đang chờ giữ nguyên mật khẩu đã lưu trên tài khoản.
        ...(found.pendingPasswordHash
          ? { passwordHash: found.pendingPasswordHash }
          : {}),
      },
    });
    return user.count === 1;
  });

  if (!verified) redirect(`${VERIFY}?error=invalid${nextSuffix}`);
  redirect(`/dang-nhap?verified=1${nextSuffix}`);
}

export async function resendVerification(formData: FormData) {
  const next = safeNext(formData.get("tiep"));
  const nextSuffix =
    next === "/tai-khoan" ? "" : `&tiep=${encodeURIComponent(next)}`;
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) redirect(`${VERIFY}?sent=1${nextSuffix}`);

  const { email } = parsed.data;
  const allowed = await allowAuthEmail("verify_email", email, await serverActionIp());
  if (allowed) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, emailVerified: true },
    });
    if (user && !user.emailVerified) {
      // Đọc trước khi phát token mới: `createAuthToken` xoá token cũ, nên không
      // mang hash chờ sang thì người dùng xác thực xong sẽ không có mật khẩu nào
      // để đăng nhập, dù họ đã đặt một cái lúc đăng ký.
      const carriedPasswordHash = await pendingPasswordHashFor(prisma, user.id);
      const created = await createAuthToken(prisma, {
        userId: user.id,
        purpose: "verify",
        ttlMs: VERIFY_TOKEN_TTL_MS,
        pendingPasswordHash: carriedPasswordHash,
      });
      await sendVerificationEmail({
        to: user.email,
        name: user.name ?? user.email,
        token: created.token,
        ...(next !== "/tai-khoan" ? { next } : {}),
      }).catch((error) => console.error("[verify] Không gửi được email:", error));
    }
  }
  redirect(`${VERIFY}?sent=1${nextSuffix}`);
}

export async function clearVerificationTokensForUser(userId: string) {
  return prisma.verificationToken.deleteMany({
    where: { identifier: authTokenIdentifier("verify", userId) },
  });
}
