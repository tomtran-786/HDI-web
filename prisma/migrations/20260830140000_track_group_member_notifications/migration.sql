-- Dấu vết "đã báo cho thành viên này rồi".
--
-- Webhook PayOS chạy cấp quyền Drive và gửi thư SAU khi transaction thanh toán
-- đã commit. Nếu lambda chết giữa chừng, lượt giao lại của PayOS trước đây trả
-- về `duplicate` và bỏ qua toàn bộ phần giao hàng — quyền Drive còn được cron
-- ngày cứu, nhưng thư báo thành viên thì không có gì cứu, và người nhận chỉ
-- thấy một lời mời chia sẻ Drive từ một tài khoản lạ.
--
-- Giờ lượt giao lại chạy lại phần giao hàng. Cột này là thứ giữ cho việc chạy
-- lại đó không biến thành một thư trùng mỗi lần PayOS gửi lại.
ALTER TABLE "order_items" ADD COLUMN "notified_at" TIMESTAMPTZ(6);

-- Đơn đã trả tiền TRƯỚC bản này đã được gửi thư ở lượt webhook của chính nó.
-- Đánh dấu để lần giao lại đầu tiên sau khi deploy không gửi lại cho tất cả.
UPDATE "order_items" oi
   SET "notified_at" = o."paid_at"
  FROM "orders" o
 WHERE o."id" = oi."order_id"
   AND o."status" = 'paid'::order_status
   AND o."paid_at" IS NOT NULL
   AND oi."member_user_id" <> o."user_id";

-- Hàng chờ gửi lại luôn được lọc bằng cặp (order_id, notified_at IS NULL).
CREATE INDEX "order_items_pending_notification_idx"
  ON "order_items"("order_id")
  WHERE "notified_at" IS NULL;
