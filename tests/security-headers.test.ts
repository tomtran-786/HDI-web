import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";
import {
  CSP_ENFORCED,
  CSP_HEADER,
  contentSecurityPolicy,
  staticSecurityHeaders,
} from "../lib/security-headers";

async function configuredHeaders() {
  const groups = await nextConfig.headers!();
  expect(groups).toHaveLength(1);
  expect(groups[0].source).toBe("/:path*");
  return new Map(
    groups[0].headers.map((h) => [h.key.toLowerCase(), h.value] as const),
  );
}

function directives(policy: string) {
  return new Map(
    policy.split("; ").map((d) => {
      const [name, ...rest] = d.split(" ");
      return [name, rest.join(" ")] as const;
    }),
  );
}

describe("header bảo mật hằng số", () => {
  it("được phát cho mọi route", async () => {
    const headers = await configuredHeaders();
    expect(headers.get("strict-transport-security")).toContain("max-age=63072000");
    expect(headers.get("strict-transport-security")).toContain("includeSubDomains");
    expect(headers.get("x-content-type-options")).toBe("nosniff");
    expect(headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("permissions-policy")).toContain("geolocation=()");
  });

  it("chặn nhúng iframe kể cả khi CSP còn ở Report-Only", async () => {
    // X-Frame-Options được enforce ngay, còn frame-ancestors trong CSP thì
    // chưa — nên đây mới là thứ đang thực sự chống clickjacking hôm nay.
    const headers = await configuredHeaders();
    expect(headers.get("x-frame-options")).toBe("DENY");
  });

  it("không quảng cáo phiên bản framework", () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it("không phát CSP — CSP thuộc về middleware vì cần nonce mỗi request", async () => {
    const headers = await configuredHeaders();
    expect(headers.has("content-security-policy")).toBe(false);
    expect(headers.has("content-security-policy-report-only")).toBe(false);
    expect(staticSecurityHeaders.map((h) => h.key)).not.toContain(
      "Content-Security-Policy",
    );
  });
});

describe("Content-Security-Policy", () => {
  const nonce = "abc123def456";
  const policy = contentSecurityPolicy(nonce);

  it("gắn nonce của request, cho phép bundle first party qua 'self', và không dùng strict-dynamic", () => {
    const scriptSrc = directives(policy).get("script-src")!;
    expect(scriptSrc).toContain(`'nonce-${nonce}'`);
    expect(scriptSrc).toContain("'self'");
    // KHÔNG 'strict-dynamic': nó vô hiệu hóa phần 'self' cho thẻ <script>, và
    // Turbopack bỏ sót nonce trên đúng thẻ preinit của một client chunk tách
    // code — thẻ đó bị chặn, làm treo điều hướng client ở màn loading skeleton
    // ngay sau khi đăng nhập. Xem chú thích trong lib/security-headers.ts.
    expect(scriptSrc).not.toContain("'strict-dynamic'");
    // Ở preview, @vercel/analytics tải script từ host này; production thì script
    // của nó nằm cùng origin nên đã thuộc 'self'.
    expect(scriptSrc).toContain("https://va.vercel-scripts.com");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });

  it("không cho 'unsafe-eval' ở production, nhưng cho ở dev để HMR chạy", () => {
    expect(contentSecurityPolicy(nonce)).not.toContain("'unsafe-eval'");
    expect(contentSecurityPolicy(nonce, { dev: true })).toContain("'unsafe-eval'");
  });

  it("khóa các directive mà mặc định của trình duyệt sẽ để hở", () => {
    const d = directives(policy);
    expect(d.get("default-src")).toBe("'self'");
    expect(d.get("frame-ancestors")).toBe("'none'");
    expect(d.get("object-src")).toBe("'none'");
    expect(d.get("base-uri")).toBe("'self'");
    expect(d.get("form-action")).toBe("'self'");
  });

  it("mỗi nonce chỉ xuất hiện trong đúng chính sách của nó", () => {
    expect(contentSecurityPolicy("nonce-a")).not.toContain("nonce-b");
  });

  it("tên header khớp với cờ enforce, để việc bật enforce không đi qua lặng lẽ", () => {
    expect(CSP_HEADER).toBe(
      CSP_ENFORCED ? "content-security-policy" : "content-security-policy-report-only",
    );
    // Enforce chỉ được bật sau khi console Report-Only đã sạch trên preview.
    expect(CSP_ENFORCED).toBe(true);
  });
});
