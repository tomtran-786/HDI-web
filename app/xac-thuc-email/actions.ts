"use server";

import { redirect } from "next/navigation";
import { emailSchema } from "@/lib/auth-input";
import { allowAuthEmail, serverActionIp } from "@/lib/auth-throttle";
import {
  authTokenIdentifier,
  consumeAuthToken,
  createAuthToken,
  VERIFY_TOKEN_TTL_MS,
} from "@/lib/auth-tokens";
import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const VERIFY = "/xac-thuc-email";

export async function verifyEmail(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!token) redirect(`${VERIFY}?error=invalid`);

  const verified = await prisma.$transaction(async (tx) => {
    const found = await consumeAuthToken(tx, "verify", token);
    if (!found) return false;
    const user = await tx.user.updateMany({
      where: { id: found.userId, emailVerified: null },
      data: { emailVerified: new Date() },
    });
    return user.count === 1;
  });

  if (!verified) redirect(`${VERIFY}?error=invalid`);
  redirect("/dang-nhap?verified=1");
}

export async function resendVerification(formData: FormData) {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) redirect(`${VERIFY}?sent=1`);

  const { email } = parsed.data;
  const allowed = await allowAuthEmail("verify_email", email, await serverActionIp());
  if (allowed) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, emailVerified: true },
    });
    if (user && !user.emailVerified) {
      const created = await createAuthToken(prisma, {
        userId: user.id,
        purpose: "verify",
        ttlMs: VERIFY_TOKEN_TTL_MS,
      });
      await sendVerificationEmail({
        to: user.email,
        name: user.name ?? user.email,
        token: created.token,
      }).catch((error) => console.error("[verify] Không gửi được email:", error));
    }
  }
  redirect(`${VERIFY}?sent=1`);
}

export async function clearVerificationTokensForUser(userId: string) {
  return prisma.verificationToken.deleteMany({
    where: { identifier: authTokenIdentifier("verify", userId) },
  });
}
