import { z } from "zod";

export const normalizeEmail = (value: string) => value.trim().toLowerCase();

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

