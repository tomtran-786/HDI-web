import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

/**
 * Fail loudly at module load rather than signing sessions with a default.
 *
 * The donor codebase carries a comment explaining why: it once shipped a
 * hardcoded fallback secret, which meant anyone who could read the repository
 * could mint a token for any user id and impersonate any student. A crash on
 * boot is strictly better than running with forgeable sessions.
 */
function requiredSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "Thiếu AUTH_SECRET. Sinh bằng `openssl rand -base64 32` rồi đặt vào " +
        ".env.local và Environment Variables trên Vercel.",
    );
  }
  return secret;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Google only. Recordings live on Google Drive and Drive grants permissions
  // to Google accounts, so an OAuth-verified Google address is exactly the
  // value `permissions.create` needs. Letting people sign in with an arbitrary
  // email would manufacture the "I logged in as A but Drive shared to B"
  // support class we are trying to avoid.
  providers: [Google],
  // Database sessions, not JWT. A JWT cannot be revoked server-side, which is
  // why the donor had to bolt on a `sessions_valid_after` column and re-check
  // the database every five minutes to fake it. Deleting a row is simpler and
  // actually correct. The cost is one query per request, which is nothing at
  // this scale.
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/dang-nhap",
  },
  callbacks: {
    session({ session, user }) {
      // Make our own user id available to route handlers and server components.
      session.user.id = user.id;
      return session;
    },
  },
  trustHost: true,
  secret: requiredSecret(),
});

/**
 * Admins are an env allowlist, not a database column.
 *
 * GĐ2 has exactly one admin and no UI for managing roles. An allowlist also
 * cannot be escalated by anything living in the database, and it is revoked by
 * editing one environment variable. Add a `role` column when a second admin
 * exists and the trade-off changes.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}
