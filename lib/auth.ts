import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { normalizeEmail } from "./auth-input";
import { authorizeCredentials } from "./authorize-credentials";
import { requiredAuthSecret } from "./auth-secret";
import {
  googleProfileHasVerifiedEmail,
  secureGoogleAccountLink,
} from "./auth-account-link";
import { jwtSurvivesSessionCutoff } from "./auth-session";
import { googleProfilePicture, safeAvatarUrl } from "./avatar";
import { syncGoogleAvatar } from "./auth-avatar";
import { adminEmails } from "./admin-emails";

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
          // Lọc trước khi PrismaAdapter ghi vào cột `image` lúc tạo tài khoản:
          // giá trị vào database phải là thứ CSP cho phép render.
          image: googleProfilePicture(profile),
        };
      },
    }),
    Credentials({
      credentials: { email: {}, password: {} },
      // Toàn bộ logic nằm trong lib/authorize-credentials.ts để test gọi được.
      authorize: (credentials, request) =>
        authorizeCredentials(credentials, request),
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
    // Không khai `error` thì mọi lỗi OAuth — ví dụ Google trả về một địa chỉ
    // chưa xác thực và callback `signIn` bên dưới từ chối — rơi vào trang lỗi
    // mặc định của Auth.js, một trang trắng không thuộc site này và không có
    // lối nào đi tiếp. Trang đăng nhập tra mã lỗi thành câu tiếng Việt.
    error: "/dang-nhap",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;
      return googleProfileHasVerifiedEmail(profile);
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.checkedAt = Math.floor(Date.now() / 1000);
        token.issuedAtMs = Date.now();

        // Ảnh trong `token` mặc định là cột `image` của database, mà cột đó chỉ
        // được ghi lúc tạo tài khoản. Lần đăng nhập Google nào cũng mang theo
        // avatar mới nhất, nên lấy từ profile rồi ghi ngược lại database.
        if (account?.provider === "google") {
          const picture = googleProfilePicture(profile);
          if (picture) {
            token.picture = picture;
            try {
              await syncGoogleAvatar(String(user.id), picture);
            } catch (error) {
              // Ảnh đại diện không đáng để chặn một lần đăng nhập: phiên này
              // vẫn có ảnh trong token, chỉ là database còn giá trị cũ.
              console.error("[auth] Không lưu được ảnh đại diện:", error);
            }
          }
        }
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
      // Chốt chặn cuối trước khi URL ảnh đi vào JSX: một giá trị cũ trong
      // database, từ trước khi có bộ lọc, không được render nguyên trạng.
      if (session.user) session.user.image = safeAvatarUrl(session.user.image);
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
export { adminEmails } from "./admin-emails";

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}
