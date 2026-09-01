-- Giá trị enum mới cho sổ credits: phần quá hạn bị xóa sổ.
--
-- ĐỨNG MỘT MÌNH TRONG MỘT MIGRATION LÀ CỐ Ý. Postgres không cho dùng một giá
-- trị enum vừa được ALTER TYPE ADD VALUE trong cùng transaction đã thêm nó, và
-- Prisma chạy mỗi file migration trong một transaction. Gộp chung với các câu
-- lệnh ở 20260901120100 thì bản CHECK nhắc tới 'expiry' sẽ đổ ngay lúc deploy.
ALTER TYPE "referral_entry_type" ADD VALUE IF NOT EXISTS 'expiry';
