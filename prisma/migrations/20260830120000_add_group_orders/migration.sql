-- Thanh toán nhóm: nhóm trưởng trả một lần cho cả nhóm.
--
-- Một đơn nhóm KHÔNG phải một loại đơn mới. Nó vẫn là một hàng `orders` với
-- nhiều `order_items`, chỉ khác ở chỗ mỗi dòng ghi danh cho một người khác
-- nhau. Nhờ vậy webhook, xác nhận ghi danh, cấp quyền Drive, hủy đơn và trả
-- ghế đều dùng lại nguyên vẹn — không mở thêm đường xác nhận thanh toán nào.
BEGIN;

-- ── order_items: ai là người được học trên dòng này ────────────────────────
-- Thêm dạng nullable rồi backfill: mọi đơn đã tồn tại đều là đơn lẻ, nên người
-- học chính là người trả tiền.
ALTER TABLE "order_items" ADD COLUMN "member_user_id" TEXT;

UPDATE "order_items" oi
   SET "member_user_id" = o."user_id"
  FROM "orders" o
 WHERE o."id" = oi."order_id";

DO $$
DECLARE
  orphans BIGINT;
BEGIN
  SELECT count(*) INTO orphans FROM "order_items" WHERE "member_user_id" IS NULL;
  IF orphans > 0 THEN
    RAISE EXCEPTION 'Còn % dòng order_items không suy ra được người học.', orphans;
  END IF;
END $$;

ALTER TABLE "order_items" ALTER COLUMN "member_user_id" SET NOT NULL;

-- ON DELETE RESTRICT, không CASCADE: xóa một tài khoản không được phép làm bốc
-- hơi một dòng của đơn hàng đã thu tiền.
ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_member_user_id_fkey"
  FOREIGN KEY ("member_user_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Giỏ hàng vẫn là một tập hợp, nhưng "một khóa một lần" nay tính THEO NGƯỜI:
-- nhóm 3 người mua cùng một khóa là ba dòng hợp lệ.
DROP INDEX "order_items_order_id_course_id_key";
CREATE UNIQUE INDEX "order_items_order_id_course_id_member_user_id_key"
  ON "order_items"("order_id", "course_id", "member_user_id");
CREATE INDEX "order_items_member_user_id_idx" ON "order_items"("member_user_id");

-- ── orders: số người đã dùng để tính giá ───────────────────────────────────
ALTER TABLE "orders" ADD COLUMN "group_size" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "orders"
  ADD CONSTRAINT "orders_group_size_check" CHECK ("group_size" >= 1);

-- ── courses: cấu hình ưu đãi nhóm ──────────────────────────────────────────
ALTER TABLE "courses" ADD COLUMN "group_eligible" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "courses" ADD COLUMN "group_price_vnd" INTEGER;

-- Giá nhóm phải rẻ hơn giá lẻ và phải là số dương. Một bản seed sai không được
-- phép biến lời mời "rủ thêm bạn" thành một hóa đơn đắt hơn mua một mình.
ALTER TABLE "courses"
  ADD CONSTRAINT "courses_group_price_vnd_check"
  CHECK (
    "group_price_vnd" IS NULL
    OR ("group_price_vnd" > 0 AND "group_price_vnd" < "price_vnd")
  );

COMMIT;
