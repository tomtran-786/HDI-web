import { z } from "zod";

export const normalizeEmail = (value: string) => value.trim().toLowerCase();

/**
 * `nguyenvana@gmail.com` → `ngu•••@gmail.com`.
 *
 * Enough for someone to recognise which of their addresses a verification link
 * belongs to, without printing the whole address onto a page whose URL carries
 * a bearer token — that URL can end up in a screenshot, a shared chat, or a
 * referrer header, and the masked form keeps the address out of all three.
 */
export function maskEmail(value: string) {
  const at = value.lastIndexOf("@");
  if (at <= 0) return "•••";
  const local = value.slice(0, at);
  const keep = Math.min(3, Math.max(1, local.length - 1));
  return `${local.slice(0, keep)}•••${value.slice(at)}`;
}

const email = z.string().trim().email().transform(normalizeEmail);
const password = z
  .string()
  .min(12, "Mật khẩu phải có ít nhất 12 ký tự.")
  .refine((value) => Buffer.byteLength(value, "utf8") <= 72, {
    message: "Mật khẩu không được dài quá 72 byte.",
  });

export const credentialsSchema = z.object({ email, password: z.string().min(1) });

export const registrationSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận không khớp.",
  });

export const emailSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(32).max(256),
    password,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận không khớp.",
  });

