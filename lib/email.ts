import { Resend } from "resend";
import { feedbackKindLabel } from "@/content/feedback";
import type { FeedbackKindInput } from "./feedback-input";
import { appUrl } from "./app-url";
import { formatVnd } from "./format";
import {
  COMMISSION_HOLD_DAYS,
  CREDIT_MAX_SHARE_PCT,
  CREDIT_TTL_MONTHS,
} from "./referral-pricing";

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

function senderDomain(from: string) {
  const address = (/<([^>]+)>/.exec(from)?.[1] ?? from).trim();
  return address.slice(address.lastIndexOf("@") + 1).toLowerCase();
}

/** Site đang chạy trên máy dev, không phải trên một tên miền thật. */
function isLocalSite() {
  const origin = process.env.APP_URL || process.env.AUTH_URL;
  if (!origin) return process.env.NODE_ENV !== "production";
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1)([:/]|$)/i.test(origin);
}

/**
 * Một lần gửi hỏng phải để lại dấu vết đọc được, không phải im lặng.
 *
 * Ở dev thì in thêm cả liên kết trong thư: khi Resend từ chối, đó là cách duy
 * nhất để chạy nốt luồng đăng ký hay đặt lại mật khẩu trên máy local. Chỉ ở
 * dev — liên kết này là bearer token, không được nằm trong log production.
 */
function failed(input: SendEmailInput, error: string) {
  console.error(
    `[email] Không gửi được "${input.subject}" tới ${input.to}: ${error}`,
  );
  if (process.env.NODE_ENV !== "production") {
    const href = /href="([^"]+)"/.exec(input.html)?.[1];
    if (href) console.error(`[email] Liên kết của thư vừa hỏng (chỉ in ở dev): ${href}`);
  }
  return { sent: false as const, error };
}

export async function sendEmail(input: SendEmailInput) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    return failed(input, "missing_configuration");
  }

  /**
   * `@resend.dev` là sender sandbox dùng chung của Resend, và nó chỉ gửi được
   * tới đúng địa chỉ email của chủ tài khoản Resend — mọi người nhận khác bị
   * trả 403, dù tài khoản đã có domain riêng verified.
   *
   * Đây là lỗi đã xảy ra thật: `EMAIL_FROM` bị đổi sang `onboarding@resend.dev`,
   * nên mọi thư xác thực gửi tới học viên bị chặn trong khi trang đăng ký vẫn
   * báo "Kiểm tra hộp thư của bạn". Chặn ngay tại đây để cấu hình sai thành một
   * lỗi hiện trên màn hình thay vì một cú 403 nằm im trong log.
   */
  if (senderDomain(from) === "resend.dev" && !isLocalSite()) {
    return failed(input, "sandbox_sender");
  }

  const { data, error } = await new Resend(key).emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
  if (error) {
    return failed(input, error.message);
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
function emailShell(
  name: string,
  body: string,
  cta?: { action: string; href: string },
) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#172636">
      <h2 style="color:#0c498f">HDI Research Center</h2>
      <p>Xin chào <strong>${escapeHtml(name)}</strong>,</p>
      ${body}
      ${
        cta
          ? `<p style="margin:28px 0"><a href="${cta.href}" style="background:#0c498f;color:#ffffff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">${cta.action}</a></p>
      <p style="font-size:13px;color:#6b7785">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.</p>`
          : ""
      }
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
      // Dòng cảnh báo không phải khách sáo. Bấm liên kết này kích hoạt mật khẩu
      // của lần đăng ký đã phát ra nó, và lần đăng ký đó không nhất thiết là
      // của chủ hộp thư — xem chú thích ở registerAccount.
      "<p>Hãy xác nhận địa chỉ email để kích hoạt đăng nhập bằng mật khẩu. Liên kết có hiệu lực trong <strong>24 giờ</strong>.</p>" +
        "<p><strong>Nếu bạn không tạo tài khoản này, đừng bấm nút bên dưới.</strong> Bấm vào đó sẽ kích hoạt tài khoản cùng mật khẩu do người đã đăng ký đặt.</p>",
      { action: "Xác thực email", href },
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
      { action: "Đặt lại mật khẩu", href },
    ),
  });
}

type FeedbackEmailInput = {
  to: string;
  name: string | null;
  kind: FeedbackKindInput;
  title: string;
};

function feedbackSummary(input: FeedbackEmailInput) {
  return `<p><strong>Loại:</strong> ${feedbackKindLabel[input.kind]}<br><strong>Tiêu đề:</strong> ${escapeHtml(input.title)}</p>`;
}

export function sendFeedbackReceivedEmail(input: FeedbackEmailInput) {
  return sendEmail({
    to: input.to,
    subject: "Đã nhận feedback của bạn — HDI Research Center",
    html: emailShell(
      input.name?.trim() || "bạn",
      "<p>Cảm ơn bạn đã gửi phản hồi. HDI đã ghi nhận nội dung dưới đây và sẽ xem xét sớm nhất có thể.</p>" +
        feedbackSummary(input),
    ),
  });
}

/**
 * Báo cho một thành viên rằng người khác vừa trả tiền ghi danh giúp họ.
 *
 * KHÔNG phải thư xã giao. Ngay sau webhook, người này nhận được lời mời chia sẻ
 * một thư mục Google Drive từ một tài khoản HDI cho khóa học họ chưa từng mua —
 * nếu không có thư này, thứ duy nhất họ thấy là một lời mời lạ trông hệt như
 * lừa đảo. Vì vậy thư nêu đích danh người đã trả tiền và một đường kiểm chứng.
 *
 * Nhóm trưởng KHÔNG nhận thư này: họ vừa tự bấm thanh toán và đã thấy trang kết
 * quả.
 */
export function sendGroupMemberEnrolledEmail(input: {
  to: string;
  name: string;
  payerName: string;
  payerEmail: string;
  courseTitles: string[];
  orderCode: number;
}) {
  const courses = input.courseTitles
    .map((title) => `<li>${escapeHtml(title)}</li>`)
    .join("");
  // Tên hiển thị do người dùng tự đặt nên có thể trống hoặc là một chuỗi bất
  // kỳ; email thì đã xác thực, nên nó mới là thứ nhận diện được người trả tiền.
  const payer = input.payerName.trim()
    ? `${escapeHtml(input.payerName.trim())} (${escapeHtml(input.payerEmail)})`
    : escapeHtml(input.payerEmail);

  return sendEmail({
    to: input.to,
    subject: "Bạn đã được ghi danh theo nhóm — HDI Research Center",
    html: emailShell(
      input.name?.trim() || "bạn",
      `<p><strong>${payer}</strong> đã đăng ký theo nhóm và thanh toán học phí giúp bạn các khóa sau:</p>` +
        `<ul>${courses}</ul>` +
        `<p>Mã đơn: <strong>${input.orderCode}</strong>. Quyền truy cập học liệu được cấp vào chính địa chỉ email này, ` +
        "bạn không cần thanh toán thêm. Link vào lớp và trạng thái cấp quyền nằm trong trang tài khoản.</p>" +
        "<p style=\"font-size:13px;color:#6b7785\">Nếu bạn không quen người nêu trên hoặc cho rằng đây là nhầm lẫn, " +
        "vui lòng liên hệ HDI để chúng tôi kiểm tra lại đơn này.</p>",
      { action: "Xem khóa học của bạn", href: `${appUrl()}/tai-khoan` },
    ),
  });
}

/**
 * Báo cho người giới thiệu biết họ vừa được cộng credits.
 *
 * Không có lá thư này thì credits chỉ tồn tại ở một trang họ không có lý do gì
 * để mở — và một phần thưởng không ai biết mình có thì không khuyến khích được
 * điều gì cả.
 *
 * Cố ý KHÔNG nêu tên hay email của người được giới thiệu: đó là thông tin của
 * người thứ ba, và việc ai mua khóa nào không phải chuyện người giới thiệu được
 * biết chỉ vì họ đưa mã.
 */
export function sendReferralCommissionEmail(input: {
  to: string;
  name: string;
  amountVnd: number;
  balanceVnd: number;
}) {
  const amount = formatVnd(input.amountVnd);
  const balance = formatVnd(input.balanceVnd);

  return sendEmail({
    to: input.to,
    subject: "Bạn vừa nhận credits giới thiệu — HDI Research Center",
    html: emailShell(
      input.name?.trim() || "bạn",
      `<p>Một người bạn giới thiệu vừa hoàn tất thanh toán khóa học đầu tiên. ` +
        `HDI đã cộng <strong>${escapeHtml(amount)}</strong> credits vào tài khoản của bạn.</p>` +
        `<p>Số dư hiện tại: <strong>${escapeHtml(balance)}</strong>.</p>` +
        `<p>Khoản này dùng được sau <strong>${COMMISSION_HOLD_DAYS} ngày</strong>, khi đã qua thời hạn hoàn phí, ` +
        `và có hạn <strong>${CREDIT_TTL_MONTHS} tháng</strong> kể từ hôm nay.</p>` +
        `<p>Credits được trừ vào học phí ở lần mua sau — bật ô “Dùng credits giới thiệu” ` +
        `trong giỏ hàng trước khi thanh toán. Mỗi lần đăng ký chỉ trừ được tối đa ` +
        `<strong>${CREDIT_MAX_SHARE_PCT}%</strong> học phí, và đơn luôn giữ lại một khoản nhỏ phải trả qua PayOS, ` +
        `nên phần dư được giữ lại cho những lần tiếp theo.</p>`,
      { action: "Xem credits của bạn", href: `${appUrl()}/tai-khoan/gioi-thieu` },
    ),
  });
}

export function sendFeedbackResolvedEmail(input: FeedbackEmailInput) {
  return sendEmail({
    to: input.to,
    subject: "Feedback của bạn đã được xử lý — HDI Research Center",
    html: emailShell(
      input.name?.trim() || "bạn",
      "<p>HDI xin báo rằng phản hồi dưới đây đã được đánh dấu là đã xử lý.</p>" +
        feedbackSummary(input),
    ),
  });
}

/**
 * Báo cho quản trị viên rằng PayOS vừa gửi về một khoản tiền không tự cấp quyền được.
 *
 * Trước đây trường hợp này chỉ để lại một dòng `console.error`. Trên Vercel
 * Hobby log runtime giữ khoảng một giờ, nên trên thực tế nó là im lặng: tiền đã
 * vào tài khoản, học viên không có quyền truy cập, và bề mặt duy nhất còn lại
 * là một hàng chờ trong /quan-tri mà không có gì thúc ai đó mở ra.
 *
 * Thư này KHÔNG xác nhận hay từ chối gì cả — nó chỉ nói "có tiền cần người
 * nhìn". Xác nhận thanh toán vẫn chỉ là việc của webhook đã ký (xem ghi chú
 * "deliberately no markPaid" ở app/quan-tri/actions.ts).
 *
 * Cố ý không nhét payload gốc của PayOS vào thư: nó chứa thông tin tài khoản
 * ngân hàng của người chuyển, và một hộp thư không phải chỗ để lưu thứ đó.
 * `providerRef` là đủ để tra ngược trong dashboard.
 */
export function sendPaymentReviewEmail(input: {
  to: string;
  label: string;
  reason: string;
  expectedVnd: number | null;
  receivedVnd: number;
  providerRef: string;
}) {
  const received = formatVnd(input.receivedVnd);
  const expected =
    input.expectedVnd === null ? "không xác định" : formatVnd(input.expectedVnd);

  return sendEmail({
    to: input.to,
    subject: `[HDI] Giao dịch cần đối soát — ${input.label}`,
    html: emailShell(
      "quản trị viên",
      `<p>PayOS vừa báo về một giao dịch mà hệ thống <strong>không tự cấp quyền</strong>. ` +
        `Đơn hàng và ghi danh giữ nguyên trạng thái cũ cho tới khi có người xử lý.</p>` +
        `<ul style="line-height:1.7">` +
        `<li>Đối tượng: <strong>${escapeHtml(input.label)}</strong></li>` +
        `<li>Lý do: <strong>${escapeHtml(input.reason)}</strong></li>` +
        `<li>Số tiền nhận được: <strong>${escapeHtml(received)}</strong></li>` +
        `<li>Số tiền đơn chờ: <strong>${escapeHtml(expected)}</strong></li>` +
        `<li>Mã giao dịch: <code>${escapeHtml(input.providerRef)}</code></li>` +
        `</ul>` +
        `<p>Mở hàng chờ đối soát tại ` +
        `<a href="${appUrl()}/quan-tri">${escapeHtml(appUrl())}/quan-tri</a>.</p>`,
    ),
  });
}
