-- Kênh báo lỗi / góp ý có cấu trúc. Dữ liệu chỉ đi qua Prisma phía server;
-- không có đường đọc hoặc ghi trực tiếp nào từ Supabase Data API.

-- CreateEnum
CREATE TYPE "feedback_kind" AS ENUM ('bug', 'idea');

-- CreateEnum
-- Thứ tự có ý nghĩa: ORDER BY status ASC đưa `open` lên đầu hàng quản trị.
CREATE TYPE "feedback_status" AS ENUM ('open', 'resolved', 'dismissed');

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" "feedback_kind" NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "body" VARCHAR(5000) NOT NULL,
    "status" "feedback_status" NOT NULL DEFAULT 'open',
    "page_url" VARCHAR(300),
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feedbacks_user_id_idx" ON "feedbacks"("user_id");

-- CreateIndex
CREATE INDEX "feedbacks_status_created_at_idx" ON "feedbacks"("status", "created_at");

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Cùng lớp khóa PostgREST với mọi bảng nội bộ khác. RLS và privilege là hai
-- lớp riêng: bật RLS để bảng trong schema public không bao giờ trần, rồi thu
-- hồi toàn bộ quyền của hai role dùng ở trình duyệt vì tính năng chỉ qua server.
ALTER TABLE "feedbacks" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "feedbacks" FROM anon, authenticated;
