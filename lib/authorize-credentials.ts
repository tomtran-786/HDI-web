import { credentialsSchema, maskEmail } from "./auth-input";
import {
  allowLoginAttempt,
  clearLoginThrottle,
  requestIp,
} from "./auth-throttle";
import { prisma } from "./prisma";
import { verifiedCredentialIdentity } from "./credential-password";

/**
 * Vì sao logic này không nằm thẳng trong cấu hình NextAuth.
 *
 * `authorize` là closure bên trong `NextAuth({...})`, nên không có cách nào gọi
 * nó từ một bài test — và đây là đúng đoạn quyết định ai vào được hệ thống.
 * Tách ra thành hàm thuần với phụ thuộc truyền vào để năm nhánh từ chối bên
 * dưới đều kiểm chứng được.
 */
export type AuthorizeDeps = {
  findUser: (email: string) => Promise<{
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    emailVerified: Date | null;
    passwordHash: string | null;
  } | null>;
  allowAttempt: (email: string, ip: string) => Promise<boolean>;
  clearThrottle: (email: string, ip: string) => Promise<void>;
  log?: Pick<Console, "warn" | "error">;
};

const defaultDeps: AuthorizeDeps = {
  findUser: (email) =>
    prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
        passwordHash: true,
      },
    }),
  allowAttempt: allowLoginAttempt,
  clearThrottle: clearLoginThrottle,
};

/**
 * Người dùng luôn nhận đúng một câu trả lời gộp — xem `signInPage.error`. Lý do
 * thật chỉ đi vào log của máy chủ, kèm email đã che.
 *
 * Có log này vì đã từng thiếu nó: một lần đăng nhập hỏng trên production phải
 * chẩn đoán bằng cách truy vấn tay vào database, chỉ để biết tài khoản đó đang
 * mang mật khẩu của lần đăng ký nào.
 */
type DenyReason =
  | "throttled"
  | "no_user"
  | "unverified"
  | "no_password"
  | "bad_password";

export async function authorizeCredentials(
  credentials: unknown,
  request: Request | undefined,
  deps: AuthorizeDeps = defaultDeps,
) {
  const log = deps.log ?? console;
  const parsed = credentialsSchema.safeParse(credentials);
  if (!parsed.success) return null;

  const { email, password } = parsed.data;
  const ip = request ? requestIp(request) : "unknown";

  const deny = (reason: DenyReason) => {
    log.warn("[auth] đăng nhập thất bại", { reason, email: maskEmail(email) });
    return null;
  };

  try {
    if (!(await deps.allowAttempt(email, ip))) return deny("throttled");

    const user = await deps.findUser(email);
    const identity = await verifiedCredentialIdentity(user, password);
    if (!identity) {
      if (!user) return deny("no_user");
      if (!user.emailVerified) return deny("unverified");
      if (!user.passwordHash) return deny("no_password");
      return deny("bad_password");
    }

    // Chỉ trả ngân sách khi mật khẩu đã đúng. Trả sớm hơn thì bộ đếm không đếm
    // được gì, vì mỗi lần đoán sai lại tự xoá dấu vết của chính nó.
    await deps.clearThrottle(email, ip);
    return identity;
  } catch (error) {
    // Database hỏng từng hiện ra thành "sai mật khẩu" và không để lại dòng log
    // nào. Người dùng vẫn nhận câu trả lời gộp, nhưng phía máy chủ phải phân
    // biệt được "gõ sai" với "hệ thống không chạy".
    log.error("[auth] không xử lý được lần đăng nhập:", error);
    return null;
  }
}
