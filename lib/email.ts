import { Resend } from "resend";

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

export function appUrl() {
  const value = process.env.APP_URL || process.env.AUTH_URL;
  if (!value) {
    if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
    throw new Error("Thiếu APP_URL cho liên kết email và callback thanh toán.");
  }
  return value.replace(/\/$/, "");
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

function emailShell(name: string, body: string, action: string, href: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#172033">
      <h2 style="color:#173f5f">HDI Research Center</h2>
      <p>Xin chào <strong>${escapeHtml(name)}</strong>,</p>
      ${body}
      <p style="margin:28px 0"><a href="${href}" style="background:#bd7a25;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">${action}</a></p>
      <p style="font-size:13px;color:#667085">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.</p>
    </div>`;
}

export function sendVerificationEmail(input: {
  to: string;
  name: string;
  token: string;
}) {
  const href = `${appUrl()}/xac-thuc-email?token=${encodeURIComponent(input.token)}`;
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
}) {
  const href = `${appUrl()}/dat-lai-mat-khau?token=${encodeURIComponent(input.token)}`;
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

