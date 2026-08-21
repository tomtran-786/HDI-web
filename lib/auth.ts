import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { credentialsSchema, normalizeEmail } from "./auth-input";
import { allowLoginAttempt, requestIp } from "./auth-throttle";
import { requiredAuthSecret } from "./auth-secret";
import {
  googleProfileHasVerifiedEmail,
  secureGoogleAccountLink,
} from "./auth-account-link";
import { jwtSurvivesSessionCutoff } from "./auth-session";
import { verifiedCredentialIdentity } from "./credential-password";

/**
 * Fail loudly at module load rather than signing sessions with a default.
 *
 * The donor codebase carries a comment explaining why: it once shipped a
 * hardcoded fallback secret, which meant anyone who could read the repository
 * could mint a token for any user id and impersonate any student. A crash on
 * boot is strictly better than running with forgeable sessions.
 */
const SESSION_RECHECK_SECONDS = 5 * 60;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: normalizeEmail(profile.email),
          image: profile.picture,
        };
      },
    }),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials, request) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        if (!(await allowLoginAttempt(email, requestIp(request)))) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            emailVerified: true,
            passwordHash: true,
          },
        });

        return verifiedCredentialIdentity(user, password);
      },
    }),
  ],
  // Auth.js Credentials only supports JWT sessions. The cutoff check below
  // restores global revocation after password reset/user deletion without a DB
  // query on every request.
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/dang-nhap",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;
      return googleProfileHasVerifiedEmail(profile);
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.checkedAt = Math.floor(Date.now() / 1000);
        token.issuedAtMs = Date.now();
        return token;
      }

      const now = Math.floor(Date.now() / 1000);
      if (token.id && now - Number(token.checkedAt ?? 0) >= SESSION_RECHECK_SECONDS) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: String(token.id) },
            select: { sessionsValidAfter: true },
          });
          if (!dbUser) return null;
          if (!jwtSurvivesSessionCutoff({
            sessionsValidAfter: dbUser.sessionsValidAfter,
            issuedAtMs: token.issuedAtMs,
            iat: token.iat,
          })) {
            return null;
          }
          token.checkedAt = now;
        } catch (error) {
          console.error("[auth] Không kiểm tra được session:", error);
          return null;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token?.id) session.user.id = String(token.id);
      return session;
    },
  },
  events: {
    async linkAccount({ user, account }) {
      if (account.provider !== "google" || !user.id) return;
      await secureGoogleAccountLink(user.id);
    },
  },
  trustHost: true,
  secret: requiredAuthSecret(),
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
