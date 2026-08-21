import { prisma } from "./prisma";
import { authTokenIdentifier } from "./auth-tokens";

export function googleProfileHasVerifiedEmail(profile: unknown) {
  const value = profile as { email?: unknown; email_verified?: unknown } | null;
  return (
    typeof value?.email === "string" &&
    value.email.length > 0 &&
    value.email_verified === true
  );
}

/**
 * Secure a Google link onto an account that was created before email ownership
 * was proved. The unverified password must not survive the link: otherwise an
 * attacker could pre-register a victim's address, wait for the victim to use
 * Google, and then sign in with the attacker's password.
 */
export async function secureGoogleAccountLink(
  userId: string,
  db: typeof prisma = prisma,
) {
  const current = await db.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });
  if (!current || current.emailVerified) return { secured: false as const };

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { emailVerified: new Date(), passwordHash: null },
    }),
    db.verificationToken.deleteMany({
      where: { identifier: authTokenIdentifier("verify", userId) },
    }),
  ]);
  return { secured: true as const };
}
