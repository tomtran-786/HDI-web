import type { NextConfig } from "next";
import { staticSecurityHeaders } from "./lib/security-headers";

// CSP không nằm ở đây: nonce đổi theo từng request nên nó được phát từ
// middleware.ts. Chỉ những header là hằng số mới đi qua chỗ này.
const nextConfig: NextConfig = {
  // Không quảng cáo phiên bản framework cho công cụ quét tự động.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: staticSecurityHeaders }];
  },
};

export default nextConfig;
