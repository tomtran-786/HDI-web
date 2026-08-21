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
    redirect(`${REGISTER}?sent=1${nextSuffix}`);
  }

  let recipient: { id: string; email: string; name: string } | null = null;
  let token: string | null = null;

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, emailVerified: true },
    });

    if (!existing) {
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
    } else if (!existing.emailVerified) {
      const createdToken = await createAuthToken(prisma, {
        userId: existing.id,
        purpose: "verify",
        ttlMs: VERIFY_TOKEN_TTL_MS,
      });
      recipient = {
        id: existing.id,
        email: existing.email,
        name: existing.name ?? existing.email,
      };
      token = createdToken.token;
    }
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code !== "P2002") console.error("[register] Không tạo được tài khoản:", error);
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
