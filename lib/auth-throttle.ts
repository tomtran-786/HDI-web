import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "./prisma";
import { requiredAuthSecret } from "./auth-secret";

type ThrottleRow = { count: number };

function throttleKey(value: string) {
  return createHmac("sha256", requiredAuthSecret())
    .update(value)
    .digest("hex");
}

/**
 * Địa chỉ IP đáng tin nhất mà request cho biết.
 *
 * `x-vercel-forwarded-for` đứng trước có lý do: `x-forwarded-for` là header do
 * client tự đặt được, nên nếu chỉ đọc nó thì mọi throttle theo IP bên dưới đều
 * bỏ qua được bằng cách đổi một dòng header mỗi lần thử. Vercel tự đặt
 * `x-vercel-forwarded-for` ở edge và ghi đè bất cứ giá trị nào client gửi lên.
 * Hai header còn lại chỉ để chạy local, nơi không có edge nào ở phía trước.
 */
const IP_HEADERS = ["x-vercel-forwarded-for", "x-real-ip", "x-forwarded-for"];

function firstIp(read: (name: string) => string | null) {
  for (const name of IP_HEADERS) {
    const value = read(name)?.split(",")[0]?.trim();
    if (value) return value;
  }
  return "unknown";
}

export function requestIp(request: Request) {
  return firstIp((name) => request.headers.get(name));
}

export async function serverActionIp() {
  const values = await headers();
  return firstIp((name) => values.get(name));
}

/** Atomically consume one fixed-window attempt. */
export async function consumeAuthLimit(input: {
  action: string;
  key: string;
  limit: number;
  windowMs: number;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const startMs = Math.floor(now.getTime() / input.windowMs) * input.windowMs;
  const windowStart = new Date(startMs);
  const expiresAt = new Date(startMs + input.windowMs * 2);
  const keyHash = throttleKey(`${input.action}:${input.key}`);

  const rows = await prisma.$queryRaw<ThrottleRow[]>`
    INSERT INTO auth_throttles
      (action, key_hash, window_start, count, expires_at)
    VALUES
      (${input.action}, ${keyHash}, ${windowStart}, 1, ${expiresAt})
    ON CONFLICT (action, key_hash, window_start)
    DO UPDATE SET
      count = auth_throttles.count + 1,
      expires_at = EXCLUDED.expires_at
    RETURNING count`;

  return (rows[0]?.count ?? input.limit + 1) <= input.limit;
}

/**
 * Hai bộ đếm, không phải một.
 *
 * Bộ đếm theo cặp `email|ip` một mình không chặn được credential stuffing: đổi
 * IP là ngân sách của email đó reset về 0, nên một botnet có bao nhiêu IP thì
 * có bấy nhiêu lần đoán vào cùng một tài khoản. Bộ đếm chỉ-theo-email đặt một
 * trần tuyệt đối cho mỗi tài khoản, bất kể request đến từ đâu.
 *
 * Trần theo email rộng hơn hẳn (30/giờ) để một người thật gõ sai mật khẩu vài
 * lần từ điện thoại rồi từ laptop không tự khóa mình ra ngoài.
 *
 * Cả hai luôn được tiêu thụ, không short-circuit: `&&` sẽ bỏ qua bộ đếm thứ hai
 * ngay khi bộ đầu từ chối, và một bộ đếm không tăng là một bộ đếm không đếm.
 */
export async function allowLoginAttempt(email: string, ip: string) {
  const [pairAllowed, emailAllowed] = await Promise.all([
    consumeAuthLimit({
      action: "password_login",
      key: `${email}|${ip}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    }),
    consumeAuthLimit({
      action: "password_login_email",
      key: `email:${email}`,
      limit: 30,
      windowMs: 60 * 60 * 1000,
    }),
  ]);
  return pairAllowed && emailAllowed;
}

/**
 * Trần cho một hành động đã đăng nhập của một tài khoản.
 *
 * Xác thực chứng minh người gọi là ai, không chứng minh họ gọi bao nhiêu lần.
 * Những action gọi thẳng sang PayOS hay Google Drive tiêu tiền và hạn ngạch
 * thật ở mỗi lần bấm, nên một tài khoản hợp lệ lặp vô hạn vẫn là một vấn đề —
 * dù nó không chạm được vào dữ liệu của ai khác.
 */
export async function allowUserAction(
  action: string,
  userId: string,
  limit: number,
  windowMs = 60 * 60 * 1000,
) {
  return consumeAuthLimit({ action, key: `user:${userId}`, limit, windowMs });
}

/**
 * Guards the token-*consuming* side of password reset, not just the request
 * side. `allowAuthEmail` throttles asking for a reset link; nothing throttled
 * actually spending one, even though that is the step where a guessed token
 * gets tried. Keyed by IP only — the reset form carries a token, not an
 * email, so there is no account identity to key on until the token resolves.
 */
export async function allowResetConsume(ip: string) {
  return consumeAuthLimit({
    action: "reset_consume",
    key: `ip:${ip}`,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
}

export async function allowAuthEmail(action: string, email: string, ip: string) {
  const [emailAllowed, ipAllowed] = await Promise.all([
    consumeAuthLimit({
      action,
      key: `email:${email}`,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    }),
    consumeAuthLimit({
      action,
      key: `ip:${ip}`,
      limit: 10,
      windowMs: 60 * 60 * 1000,
    }),
  ]);
  return emailAllowed && ipAllowed;
}

export async function pruneAuthThrottles(now = new Date()) {
  const result = await prisma.authThrottle.deleteMany({
    where: { expiresAt: { lt: now } },
  });
  return result.count;
}

