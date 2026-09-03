import "../prisma/load-env";
import { appUrl } from "@/lib/app-url";
import { payosClient } from "@/lib/payos";

/**
 * Đăng ký (lại) webhook URL với PayOS.
 *
 * Chạy tay khi có đơn đã trả tiền mà vẫn treo `pending` — dấu hiệu PayOS không
 * còn giao webhook (URL chưa xác nhận, hoặc bị PayOS tự tắt sau nhiều lần trả
 * non-2xx). `webhooks.confirm` bắt PayOS ping thử endpoint rồi mới ghi nhận, nên
 * chạy xong là biết webhook sống lại chưa.
 *
 *   npx tsx scripts/confirm-payos-webhook.ts
 *
 * Cùng việc này cũng có nút trong /quan-tri ("Đăng ký lại webhook"). Cố ý KHÔNG
 * nằm trong vercel.json / cron: nó là một thao tác khôi phục một lần.
 */
async function main() {
  const url = `${appUrl()}/api/webhooks/payos`;
  console.log("Đăng ký webhook PayOS:", url);
  const result = await payosClient().webhooks.confirm(url);
  console.log("PayOS xác nhận:", JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("Đăng ký hỏng:", error);
  process.exit(1);
});
