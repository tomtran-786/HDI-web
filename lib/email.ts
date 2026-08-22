import { Resend } from "resend";
import { appUrl } from "./app-url";

// Re-exported so callers that already reach for the email module — and the
// tests that mock it — keep working after the helper moved to ./app-url.
export { appUrl };

type SendEmailInput = { to: string; subject: string; html: string };

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        char
      ]!,
  );
}

export async function sendEmail(input: SendEmailInput) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    console.error("[email] Thiếu RESEND_API_KEY hoặc EMAIL_FROM.");
    return { sent: false as const, error: "missing_configuration" };
  }

  const { data, error } = await new Resend(key).emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
  if (error) {
    console.error("[email] Resend từ chối email:", error.message);
    return { sent: false as const, error: error.message };
  }
  return { sent: true as const, id: data?.id };
}

/**
 * The palette here is the site's own, hardcoded because mail clients strip CSS
 * custom properties: --primary #0c498f, --fg #172636, --fg-subtle #6b7785.
 * Keep them in step with app/globals.css by hand.
 *
 * Note for anyone tempted to brighten the button: the orange accent this
 * template originally used was retired from the whole site on 2026-08-19
 * (Plan.MD §2 — one palette only). An email is the first HDI surface a student
 * ever sees, so it does not get its own colour scheme.
 */
function emailShell(name: string, body: string, action: string, href: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#172636">
      <h2 style="color:#0c498f">HDI Research Center</h2>
      <p>Xin chào <strong>${escapeHtml(name)}</strong>,</p>
      ${body}
      <p style="margin:28px 0"><a href="${href}" style="background:#0c498f;color:#ffffff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">${action}</a></p>
      <p style="font-size:13px;color:#6b7785">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.</p>
    </div>`;
}

export function sendVerificationEmail(input: {
  to: string;
  name: string;
  token: string;
  next?: string;
}) {
  const nextQuery = input.next
    ? `&tiep=${encodeURIComponent(input.next)}`
    : "";
  const href = `${appUrl()}/xac-thuc-email?token=${encodeURIComponent(input.token)}${nextQuery}`;
  return sendEmail({
    to: input.to,
    subject: "Xác thực tài khoản học viên — HDI Research Center",
    html: emailShell(
      input.name,
      "<p>Hãy xác nhận địa chỉ email để kích hoạt đăng nhập bằng mật khẩu. Liên kết có hiệu lực trong <strong>24 giờ</strong>.</p>",
      "Xác thực email",
      href,
    ),
  });
}

export function sendPasswordResetEmail(input: {
  to: string;
  name: string;
  token: string;
  next?: string;
}) {
  const nextQuery = input.next
    ? `&tiep=${encodeURIComponent(input.next)}`
    : "";
  const href = `${appUrl()}/dat-lai-mat-khau?token=${encodeURIComponent(input.token)}${nextQuery}`;
  return sendEmail({
    to: input.to,
    subject: "Đặt lại mật khẩu — HDI Research Center",
    html: emailShell(
      input.name,
      "<p>Bạn vừa yêu cầu đặt lại mật khẩu. Liên kết có hiệu lực trong <strong>30 phút</strong> và chỉ dùng được một lần.</p>",
      "Đặt lại mật khẩu",
      href,
    ),
  });
}
