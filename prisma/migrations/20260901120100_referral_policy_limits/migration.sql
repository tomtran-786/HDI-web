-- Chính sách giới thiệu bạn bè bản 2026-09-01: credits có thời gian giữ và có
-- hạn dùng.
--
-- Hai cột dưới đây là thứ khiến hai câu trong điều khoản có hiệu lực thật:
--
--   "Credit chỉ phát sinh sau khi học viên mới thanh toán đầy đủ và hết thời
--    hạn hoàn phí"  → available_at
--   "Credit có thời hạn sáu tháng"                        → expires_at
--
-- Ba giới hạn còn lại của chính sách nằm ở tầng code, và chỉ ở đó:
--   · trần 30% học phí mỗi lần đăng ký  → lib/referral-pricing.ts
--   · tối đa 5 lượt thưởng trong 6 tháng → lib/referral-ledger.ts
--   · ưu đãi không cộng dồn              → lib/referral-pricing.ts
-- Không cái nào diễn đạt được bằng một ràng buộc của Postgres, vì cả ba đều
-- cần tổng hợp nhiều hàng ở thời điểm ghi. Đó là lý do chúng có test riêng.

ALTER TABLE "referral_ledger"
  ADD COLUMN "available_at" TIMESTAMPTZ(6),
  ADD COLUMN "expires_at"   TIMESTAMPTZ(6);

-- Backfill KHÔNG HỒI TỐ, theo cả hai chiều.
--
-- available_at = created_at: khoản hoa hồng người ta đã có và đã thấy trên
-- trang tài khoản không được phép bị khóa lại vì một chính sách ra sau.
--
-- expires_at = now() + 6 tháng: tính từ created_at thì một khoản ghi tháng
-- Hai sẽ hết hạn ngay trong lần chạy cron đầu tiên — HDI lấy lại credits mà
-- chủ sở hữu chưa từng được báo là chúng có hạn.
UPDATE "referral_ledger"
   SET "available_at" = "created_at",
       "expires_at"   = now() + interval '6 months'
 WHERE "type" = 'commission';

-- Hàng xóa sổ luôn là số âm. `expireCredits` tự kẹp về 0 trước khi ghi, nhưng
-- một lần sửa dữ liệu tay sai dấu sẽ PHÁT credits thay vì thu hồi, và không có
-- gì trong code bắt được điều đó.
ALTER TABLE "referral_ledger" ADD CONSTRAINT "referral_ledger_expiry_negative_check"
  CHECK ("type" <> 'expiry' OR "amount_vnd" < 0);

-- Cron quét theo (chủ số dư, hạn dùng); không có index này thì mỗi đêm là một
-- lần quét toàn bảng.
CREATE INDEX "referral_ledger_user_id_expires_at_idx"
  ON "referral_ledger"("user_id", "expires_at");
