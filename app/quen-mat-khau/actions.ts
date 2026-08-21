"use server";

import { redirect } from "next/navigation";
import { emailSchema } from "@/lib/auth-input";
import { allowAuthEmail, serverActionIp } from "@/lib/auth-throttle";
import { createAuthToken, RESET_TOKEN_TTL_MS } from "@/lib/auth-tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { safeNext } from "@/lib/safe-path";

const FORGOT = "/quen-mat-khau";

export async function requestPasswordReset(formData: FormData) {
  const next = safeNext(formData.get("tiep"));
  const nextSuffix =
    next === "/tai-khoan" ? "" : `&tiep=${encodeURIComponent(next)}`;
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) redirect(`${FORGOT}?sent=1${nextSuffix}`);

  const { email } = parsed.data;
  const allowed = await allowAuthEmail("reset_email", email, await serverActionIp());
  if (allowed) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, emailVerified: true },
    });
    if (user?.emailVerified) {
      const created = await createAuthToken(prisma, {
        userId: user.id,
        purpose: "reset",
        ttlMs: RESET_TOKEN_TTL_MS,
      });
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name ?? user.email,
        token: created.token,
        ...(next !== "/tai-khoan" ? { next } : {}),
      }).catch((error) => console.error("[reset] Không gửi được email:", error));
    }
  }
  redirect(`${FORGOT}?sent=1${nextSuffix}`);
}
