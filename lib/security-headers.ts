/**
 * Chính sách bảo mật HTTP, dùng chung cho middleware, next.config.ts và test.
 *
 * CSP phải sinh theo từng request nên nó sống ở middleware; các header còn lại
 * là hằng số nên đi qua next.config.ts. Cả hai đọc từ file này để không bao giờ
 * có hai phiên bản chính sách lệch nhau.
 */

/** Enforced only after the Report-Only preview completed with zero violations. */
export const CSP_ENFORCED = true;

export const CSP_HEADER = CSP_ENFORCED
  ? "content-security-policy"
  : "content-security-policy-report-only";

/**
 * `nonce` chứ không phải hash, và đây không phải lựa chọn thẩm mỹ.
 *
 * Ngoài script bootstrap theme của chúng ta, Next còn tự phát ba script inline
 * nữa trên mỗi trang: bộ khởi động runtime và dữ liệu React Flight. Nội dung
 * của chúng đổi theo từng lần render, nên KHÔNG thể băm trước để đưa vào chính
 * sách — thử bằng hash thì lúc enforce sẽ chặn đúng những script làm trang chạy
 * được. Nonce là cơ chế duy nhất Next hỗ trợ cho việc này: khi thấy nonce trong
 * header request, Next tự đóng dấu nó lên mọi thẻ script của mình.
 *
 * KHÔNG dùng `'strict-dynamic'`, và đây là bài học phải trả giá.
 *
 * Bản build production (Turbopack) đóng dấu nonce lên gần như mọi thẻ script,
 * NHƯNG bỏ sót đúng một thứ: thẻ `<script>` "preinit" mà React phát cho một
 * client chunk bị tách code (ví dụ chunk chứa `components/ui/reveal.tsx`, có
 * mặt trên mọi trang auth qua `SectionHeading`). Theo spec, khi có
 * `'strict-dynamic'` thì trình duyệt VÔ HIỆU HÓA phần allowlist theo `'self'`
 * cho thẻ `<script>` — nên đúng cái thẻ thiếu nonce đó bị chặn ở mọi lần tải.
 *
 * Tải nguyên trang thì sống sót được: HTML đã render sẵn và Turbopack runtime
 * nạp lại module qua đường tin cậy. Nhưng điều hướng phía client thì chết: ngay
 * sau khi đăng nhập, `signIn` redirect và Next soft-navigate sang `/tai-khoan`
 * → `/hoan-tat-ho-so`; segment mới không có HTML sẵn, RSC payload tham chiếu
 * chunk thiếu nonce, chunk bị chặn, segment không render xong, và `loading.tsx`
 * skeleton đứng đó vĩnh viễn cho tới khi người dùng tự tải lại.
 *
 * Cho `'self'` vào `script-src` để mọi bundle `/_next/static/**` của first
 * party load được bất kể nonce. Nonce vẫn giữ nguyên tác dụng với script
 * inline — đó mới là thứ nó cần chặn. Cái giá: allowlist theo host cho script
 * quay lại, nên phải liệt kê tường minh host mà @vercel/analytics dùng ở
 * preview (`va.vercel-scripts.com`); ở production script của nó nằm cùng origin
 * `/_vercel/insights/script.js` nên đã nằm trong `'self'`.
 */
export function contentSecurityPolicy(
  nonce: string,
  { dev = false }: { dev?: boolean } = {},
) {
  return [
    "default-src 'self'",
    // Dev cần 'unsafe-eval' cho HMR của Next; production thì không.
    `script-src 'self' 'nonce-${nonce}' https://va.vercel-scripts.com${dev ? " 'unsafe-eval'" : ""}`,
    // Next inject style inline cho next/font. Không bỏ 'unsafe-inline' được ở
    // đây mà không hỏng layout.
    "style-src 'self' 'unsafe-inline'",
    // next/font tự host font trong /_next/static, không gọi ra Google.
    "font-src 'self' data:",
    // lh3.googleusercontent.com: ảnh đại diện của tài khoản đăng nhập bằng Google.
    "img-src 'self' data: blob: https://lh3.googleusercontent.com",
    // @vercel/analytics gửi beacon về same-origin; script của nó có thể đến từ
    // va.vercel-scripts.com ở preview.
    "connect-src 'self' https://va.vercel-scripts.com https://*.vercel-insights.com",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

/** Header không phụ thuộc request, phát từ next.config.ts cho mọi route. */
export const staticSecurityHeaders = [
  // Hai năm, kèm subdomain, sẵn sàng preload. Vercel đã ép HTTPS ở edge; header
  // này là thứ ngăn request HTTP ĐẦU TIÊN của một khách quay lại.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Giữ đường dẫn nội bộ — kể cả URL xác thực email có mang token — khỏi
  // Referer khi người dùng bấm sang site khác.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Trùng ý với frame-ancestors trong CSP, dành cho trình duyệt chưa đọc CSP3.
  // Header này ĐƯỢC enforce ngay cả khi CSP còn ở Report-Only.
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];
