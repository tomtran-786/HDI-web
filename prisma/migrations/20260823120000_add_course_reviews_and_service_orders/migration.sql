-- Đánh giá khóa học của học viên, và đơn dịch vụ kiểm tra AI/đạo văn.
--
-- Hai tính năng không liên quan nhau nằm chung một migration vì chúng lên cùng
-- một lần triển khai. Không có phụ thuộc nào giữa `course_reviews` và
-- `service_orders`; phần cuối file mới là chỗ hai đường gặp nhau, ở `payments`.

-- CreateEnum
CREATE TYPE "review_status" AS ENUM ('pending', 'published', 'rejected');

-- CreateTable
CREATE TABLE "course_reviews" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" VARCHAR(1000),
    "status" "review_status" NOT NULL DEFAULT 'pending',
    "moderated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_orders" (
    "id" TEXT NOT NULL,
    "code" SERIAL NOT NULL,
    "ref" VARCHAR(32) NOT NULL,
    "kind" VARCHAR(20) NOT NULL,
    "word_count" INTEGER NOT NULL,
    "tier" VARCHAR(30) NOT NULL,
    "amount_vnd" INTEGER NOT NULL,
    "status" "order_status" NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "paid_at" TIMESTAMPTZ(6),
    "closed_at" TIMESTAMPTZ(6),
    "provider" VARCHAR(20),
    "provider_ref" VARCHAR(120),
    "checkout_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_reviews_course_id_status_idx" ON "course_reviews"("course_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "course_reviews_course_id_user_id_key" ON "course_reviews"("course_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_code_key" ON "service_orders"("code");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_ref_key" ON "service_orders"("ref");

-- CreateIndex
CREATE INDEX "service_orders_status_expires_at_idx" ON "service_orders"("status", "expires_at");

-- AddForeignKey
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Miền giá trị của số sao, thứ Prisma không diễn đạt được trong schema.
--
-- Không phải phòng xa: điểm trung bình của một khóa được tính bằng AVG trên cột
-- này, nên đúng một hàng ghi 0 hay 99 là đủ làm sai con số hiển thị trên trang
-- bán hàng, và sai theo cách không ai nhìn bảng mà thấy được. Kiểm tra ở server
-- action là lớp thứ nhất; đây là lớp cuối cùng, và là lớp duy nhất còn đúng khi
-- một đường ghi mới được thêm vào mà quên mất lớp thứ nhất.
ALTER TABLE "course_reviews"
  ADD CONSTRAINT "course_reviews_rating_range" CHECK ("rating" BETWEEN 1 AND 5);

-- Sàn mã đơn dịch vụ.
--
-- PayOS đòi `orderCode` là số nguyên duy nhất VĨNH VIỄN trong phạm vi một
-- merchant. `orders` và `service_orders` là hai bảng có hai sequence riêng, nên
-- nếu cả hai cùng đếm từ mặc định thì đơn khóa học và đơn dịch vụ sẽ va nhau ở
-- phía PayOS — và va vào lúc nào là chuyện của lưu lượng, không phải của code,
-- nên không test nào thấy trước được. Đẩy sàn lên 900000001 giữ hai dải tách
-- hẳn: `orders` (bắt đầu ở 100001) phải phát ra ~900 triệu đơn mới chạm tới.
ALTER SEQUENCE "service_orders_code_seq" RESTART WITH 900000001;

-- `payments` trở thành sổ tiền dùng chung cho cả hai loại đơn.
--
-- Cách khác là dựng một bảng `service_payments` riêng, và cách đó SAI ở đúng
-- chỗ quan trọng nhất: khóa idempotency của webhook là `(provider,
-- provider_ref)`, tức mã giao dịch ngân hàng. Mã đó là duy nhất trên toàn hệ
-- thống PayOS, nên khóa canh nó cũng phải là một khóa duy nhất trên toàn hệ
-- thống. Hai bảng là hai khóa, và cùng một mã giao dịch sẽ ghi được hai lần —
-- một lần cho mỗi bảng — mà không bảng nào biết bảng kia đã ghi.
--
-- Đổi lại, `order_id` phải cho phép NULL. CHECK bên dưới trả lại đúng ràng buộc
-- vừa bị nới: mỗi hàng payment thuộc về đúng MỘT đơn, không phải cả hai và cũng
-- không phải không đơn nào.
ALTER TABLE "payments" ADD COLUMN "service_order_id" TEXT;
ALTER TABLE "payments" ALTER COLUMN "order_id" DROP NOT NULL;
ALTER TABLE "payments"
  ADD CONSTRAINT "payments_exactly_one_owner"
  CHECK (num_nonnulls("order_id", "service_order_id") = 1);

-- CreateIndex
CREATE INDEX "payments_service_order_id_idx" ON "payments"("service_order_id");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Cùng một lớp khóa PostgREST như 20260820120100 và 20260820130000. ALTER
-- DEFAULT PRIVILEGES ở migration đầu đã chặn anon nhận quyền mới, nhưng row
-- level security là thiết lập theo từng bảng và phải bật tay: một bảng mới
-- trong `public` mặc định đọc được bằng anon key của Supabase, và anon key là
-- thứ được thiết kế để công bố.
ALTER TABLE "course_reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "service_orders" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "course_reviews", "service_orders" FROM anon, authenticated;
REVOKE ALL ON SEQUENCE "service_orders_code_seq" FROM anon, authenticated;
