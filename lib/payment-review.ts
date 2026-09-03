import { adminEmails } from "./admin-emails";
import { sendPaymentReviewEmail } from "./email";
import type { PaymentReview } from "./orders";

export type { PaymentReview };

/**
 * Đưa một khoản tiền treo tới tay người có thể xử lý nó.
 *
 * Nhấc ra khỏi app/api/webhooks/payos/route.ts để BA nơi cùng gọi được: webhook
 * đã ký, poller `/api/trang-thai-don`, và cron hằng ngày. Cùng một lá thư "cần
 * đối soát", cùng một kỷ luật — gửi thư không bao giờ được làm hỏng phản hồi của
 * nơi gọi, nên mọi lỗi ở đây đều bị nuốt sau khi log.
 *
 * ĐỌC `result.sent`, không chỉ `await`: `sendEmail` báo Resend từ chối bằng
 * `{ sent: false }` chứ không ném, nên `catch` sẽ không bao giờ chạy cho trường
 * hợp đó — đúng cái bẫy đã làm mọi thư xác thực biến mất trong im lặng.
 *
 * Một file riêng, không nằm trong lib/email.ts: nó kéo `adminEmails()` lại, và
 * cùng lý do với lib/admin-emails.ts — webhook là đường máy-gọi-máy, không nên
 * kéo theo gì thừa.
 */
export async function notifyPaymentReview(review: PaymentReview) {
  const recipients = adminEmails();
  if (recipients.length === 0) {
    console.error(
      "[payment-review] Có giao dịch cần đối soát nhưng ADMIN_EMAILS trống:",
      review,
    );
    return;
  }

  for (const to of recipients) {
    try {
      const sent = await sendPaymentReviewEmail({ to, ...review });
      if (!sent.sent) {
        console.error(
          `[payment-review] Thư đối soát tới ${to} bị từ chối: ${sent.error}`,
        );
      }
    } catch (error) {
      console.error(`[payment-review] Không gửi được thư đối soát tới ${to}:`, error);
    }
  }
}
