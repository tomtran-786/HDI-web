/**
 * The one place that knows the site's canonical public origin.
 *
 * Verification/reset links, PayOS return URLs, `metadataBase`, robots.txt and
 * the sitemap all have to agree on a single origin — a mismatch means a user
 * lands on a host that does not hold their session cookie. Everything reads it
 * from `APP_URL` (falling back to Auth.js's `AUTH_URL`) rather than hardcoding
 * a domain, so moving the site is an environment change, not a code change.
 */
export function appUrl() {
  const value = process.env.APP_URL || process.env.AUTH_URL;
  if (!value) {
    if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
    throw new Error("Thiếu APP_URL cho liên kết email và callback thanh toán.");
  }
  return value.replace(/\/$/, "");
}
