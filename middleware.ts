import { NextResponse, type NextRequest } from "next/server";
import { CSP_HEADER, contentSecurityPolicy } from "@/lib/security-headers";

/**
 * Phát Content-Security-Policy kèm nonce sinh mới theo từng request.
 *
 * KHÔNG import Prisma, lib/auth hay googleapis vào đây. Middleware chạy trên
 * edge runtime, nơi `pg` không chạy được, và mọi thứ import vào đây đều nằm
 * trên đường đi của từng request.
 *
 * Cái giá đã biết: `app/layout.tsx` phải đọc `headers()` để lấy nonce, việc đó
 * kéo mọi route ra khỏi static rendering — kể cả trang chủ. Đó là đánh đổi bắt
 * buộc, không phải sơ suất: Next phát script inline có nội dung đổi mỗi lần
 * render, nên không có nonce thì không có CSP nào enforce được (xem
 * lib/security-headers.ts).
 */
export function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const policy = contentSecurityPolicy(nonce, {
    dev: process.env.NODE_ENV !== "production",
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next đọc header REQUEST này để tự đóng dấu nonce lên các thẻ <script> của
  // chính nó. Header request không đi ra trình duyệt; thứ tới trình duyệt là
  // header response bên dưới.
  requestHeaders.set("content-security-policy", policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(CSP_HEADER, policy);
  return response;
}

export const config = {
  matcher: [
    /*
     * Bỏ qua asset tĩnh, và bỏ qua hai đường máy-gọi-máy:
     *  - /api/webhooks/payos : PayOS gọi vào, không bao giờ được thêm rào.
     *  - /api/cron/*         : Vercel Cron gọi vào, đã tự xác thực bằng bearer.
     * Cả hai trả JSON, không render HTML, nên CSP không có việc gì ở đó.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks/payos|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
