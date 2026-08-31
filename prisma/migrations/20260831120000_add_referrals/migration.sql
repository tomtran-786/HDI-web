-- Giới thiệu bạn bè: cả hai bên cùng được 10%, đúng một lần cho mỗi tài khoản.
--
-- Người mới được giảm 10% ngay ở đơn ĐẦU TIÊN của họ; người giới thiệu được
-- cộng 10% credits trên tiền thực thu của chính đơn đó, và tiêu credits ở lần
-- mua sau. Không có đường rút tiền mặt.
--
-- Số dư là MỘT công thức duy nhất, không có cột số dư nào:
--   balance = SUM(amount_vnd) WHERE user_id = ? AND status <> 'void'
--
-- Bốn UNIQUE INDEX CÓ ĐIỀU KIỆN ở cuối file là phần quan trọng nhất và là phần
-- Prisma không diễn đạt được: chúng là tuyến phòng thủ ĐỘC LẬP với mọi guard
-- viết trong code. `prisma migrate` sẽ không bao giờ tự sinh ra chúng, nên xóa
-- nhầm là mất tuyến đó mà không có gì báo lỗi.
BEGIN;

-- ── Sổ credits ─────────────────────────────────────────────────────────────

-- CreateEnum
CREATE TYPE "referral_entry_type" AS ENUM ('commission', 'redemption', 'adjustment');

-- CreateEnum
CREATE TYPE "referral_entry_status" AS ENUM ('posted', 'reserved', 'applied', 'void');

-- CreateTable
CREATE TABLE "referral_ledger" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "referral_entry_type" NOT NULL,
    "status" "referral_entry_status" NOT NULL DEFAULT 'posted',
    -- Dương = cộng vào số dư, âm = trừ. Trả tiền/hoàn credits luôn là một DÒNG
    -- MỚI chứ không phải sửa dòng cũ, nhờ vậy công thức số dư ở đầu file không
    -- cần một trường hợp đặc biệt nào.
    "amount_vnd" INTEGER NOT NULL,
    "order_id" TEXT,
    "referee_user_id" TEXT,
    "rate_pct" INTEGER,
    "basis_vnd" INTEGER,
    "note" VARCHAR(200),
    "notified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settled_at" TIMESTAMPTZ(6),

    CONSTRAINT "referral_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- Đây là index chống đỡ phép tính số dư, chạy trên mọi lần mở giỏ hàng.
CREATE INDEX "referral_ledger_user_id_status_idx" ON "referral_ledger"("user_id", "status");
CREATE INDEX "referral_ledger_order_id_idx" ON "referral_ledger"("order_id");
CREATE INDEX "referral_ledger_referee_user_id_idx" ON "referral_ledger"("referee_user_id");

-- AddForeignKey
ALTER TABLE "referral_ledger" ADD CONSTRAINT "referral_ledger_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SET NULL chứ không CASCADE: mất người được giới thiệu hay mất đơn không được
-- phép làm bốc hơi một dòng sổ đã ghi. Sổ phải đọc lại được kể cả khi bối cảnh
-- quanh nó đã biến mất.
ALTER TABLE "referral_ledger" ADD CONSTRAINT "referral_ledger_referee_user_id_fkey"
  FOREIGN KEY ("referee_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "referral_ledger" ADD CONSTRAINT "referral_ledger_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── users: mã giới thiệu và quan hệ được giới thiệu ────────────────────────

ALTER TABLE "users" ADD COLUMN "referral_code" VARCHAR(12);
ALTER TABLE "users" ADD COLUMN "referred_by_id" TEXT;

CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");
CREATE INDEX "users_referred_by_id_idx" ON "users"("referred_by_id");

-- SET NULL: xóa người giới thiệu không được xóa lây người được giới thiệu.
ALTER TABLE "users" ADD CONSTRAINT "users_referred_by_id_fkey"
  FOREIGN KEY ("referred_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Tự giới thiệu chính mình là bất khả về mặt cấu trúc (chưa có tài khoản thì
-- chưa biết mã của mình), nhưng một lệnh UPDATE tay thì không biết điều đó.
ALTER TABLE "users" ADD CONSTRAINT "users_referred_by_id_not_self_check"
  CHECK ("referred_by_id" IS NULL OR "referred_by_id" <> "id");

-- ── verification_tokens: mã giới thiệu đi theo token ───────────────────────
-- Cùng lý do với `pending_password_hash`: đăng ký lại một địa chỉ chưa xác thực
-- là hợp lệ, và lúc đó hàng `users` không bị đụng tới. Mã phải bám vào đúng lần
-- đăng ký phát ra nó.
ALTER TABLE "verification_tokens" ADD COLUMN "pending_referrer_id" TEXT;

-- ── orders: hai khoản trừ ở mức đơn ────────────────────────────────────────

ALTER TABLE "orders" ADD COLUMN "referral_discount_vnd" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "credit_applied_vnd" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "orders" ADD CONSTRAINT "orders_referral_discount_vnd_check"
  CHECK ("referral_discount_vnd" >= 0);
ALTER TABLE "orders" ADD CONSTRAINT "orders_credit_applied_vnd_check"
  CHECK ("credit_applied_vnd" >= 0);

-- Đơn 0đ KHÔNG tạo được link PayOS, và chỉ webhook PayOS đã ký mới được phép
-- flip một đơn sang `paid`. Một đơn không trả được đồng nào là một đơn không có
-- đường xác nhận nào cả — khách kẹt ở ngõ cụt mà không hiểu vì sao. Đây chính
-- là ràng buộc khiến "credits không bao giờ được trừ hết số phải trả" có hiệu
-- lực ở tầng dữ liệu chứ không chỉ ở tầng code.
--
-- Kiểm trước để thông báo nói được phải làm gì: lỗi CHECK trần chỉ nêu tên ràng
-- buộc, không nói đơn nào đang sai.
DO $$
DECLARE
  freebies BIGINT;
BEGIN
  SELECT count(*) INTO freebies FROM "orders" WHERE "amount_vnd" <= 0;
  IF freebies > 0 THEN
    RAISE EXCEPTION
      'Có % đơn với amount_vnd <= 0. Đóng hoặc sửa chúng trước khi chạy migration này.',
      freebies;
  END IF;
END $$;

ALTER TABLE "orders" ADD CONSTRAINT "orders_amount_vnd_positive_check"
  CHECK ("amount_vnd" > 0);

-- ── Bốn UNIQUE INDEX CÓ ĐIỀU KIỆN ──────────────────────────────────────────
-- Prisma không diễn đạt được vị từ WHERE trong @@unique, nên chúng chỉ tồn tại
-- ở đây. Mỗi cái đóng một cửa mà code phía trên đã đóng một lần rồi; hai lớp là
-- cố ý, vì lớp trong code chỉ đúng chừng nào không ai viết thêm một đường ghi
-- sổ thứ hai.

-- Một đơn chỉ sinh hoa hồng đúng một lần, kể cả khi PayOS giao lại webhook.
CREATE UNIQUE INDEX "referral_ledger_commission_order_key"
  ON "referral_ledger"("order_id") WHERE "type" = 'commission';

-- Mỗi tài khoản chỉ mang lại hoa hồng đúng một lần — "lần thanh toán đầu tiên".
-- Đơn thứ hai của cùng người được giới thiệu va vào đây và không cộng gì thêm.
CREATE UNIQUE INDEX "referral_ledger_commission_referee_key"
  ON "referral_ledger"("referee_user_id") WHERE "type" = 'commission';

-- Một đơn chỉ giữ chỗ credits một lần.
CREATE UNIQUE INDEX "referral_ledger_redemption_order_key"
  ON "referral_ledger"("order_id") WHERE "type" = 'redemption';

-- Mỗi tài khoản chỉ có MỘT đơn còn sống mang giảm giá giới thiệu. Đây là thứ
-- đóng cuộc đua hai tab checkout mở cùng lúc: cả hai đọc thấy "chưa từng dùng"
-- rồi cùng ghi, và không có index này thì cả hai đều được giảm.
CREATE UNIQUE INDEX "orders_referral_discount_once_key"
  ON "orders"("user_id")
  WHERE "referral_discount_vnd" > 0 AND "status" IN ('pending', 'paid');

-- Cùng lớp khóa PostgREST với mọi bảng nội bộ khác. RLS và privilege là hai lớp
-- riêng: bật RLS để bảng trong schema public không bao giờ trần, rồi thu hồi
-- toàn bộ quyền của hai role dùng ở trình duyệt vì tính năng chỉ qua server.
ALTER TABLE "referral_ledger" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "referral_ledger" FROM anon, authenticated;

COMMIT;
