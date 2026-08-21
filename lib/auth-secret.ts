export function requiredAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "Thiếu AUTH_SECRET. Sinh bằng `openssl rand -base64 32` rồi đặt vào " +
        ".env.local và Environment Variables trên Vercel.",
    );
  }
  return secret;
}

