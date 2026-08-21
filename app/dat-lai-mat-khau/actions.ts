"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { resetPasswordSchema } from "@/lib/auth-input";
import { consumeAuthToken } from "@/lib/auth-tokens";
import { prisma } from "@/lib/prisma";

const RESET = "/dat-lai-mat-khau";

export async function resetPassword(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) redirect(`${RESET}?error=invalid`);

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const changed = await prisma.$transaction(async (tx) => {
    const found = await consumeAuthToken(tx, "reset", parsed.data.token);
    if (!found) return false;
    const result = await tx.user.updateMany({
      where: { id: found.userId, emailVerified: { not: null } },
      data: { passwordHash, sessionsValidAfter: new Date() },
    });
    return result.count === 1;
  });

  if (!changed) redirect(`${RESET}?error=invalid`);
  redirect("/dang-nhap?reset=1");
}
