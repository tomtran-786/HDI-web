-- Đơn dịch vụ phải thuộc về một tài khoản.
--
-- Quyết định của chủ trang (2026-08-23): mọi thứ có thu tiền trên trang này đều
-- đi qua đăng nhập. Trước đó đơn dịch vụ cố tình không có chủ để giảm ma sát cho
-- một dịch vụ 35K; đổi lại, trang kết quả chỉ được che bằng một `ref` ngẫu nhiên
-- và không có cách nào tìm lại đơn nếu học viên đóng tab.
--
-- Thêm thẳng cột NOT NULL được vì `service_orders` vừa sinh ra ở migration
-- 20260823120000 và chưa có hàng nào: chưa có đường ghi nào hoạt động ở thời
-- điểm đó. Nếu về sau bảng đã có dữ liệu thì lệnh này sẽ hỏng NGAY thay vì âm
-- thầm gán đơn cho nhầm người — đó là hành vi đúng.
ALTER TABLE "service_orders" ADD COLUMN "user_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "service_orders_user_id_status_idx" ON "service_orders"("user_id", "status");

-- Cascade: xóa tài khoản thì đơn dịch vụ của họ không còn ai để thuộc về. Khác
-- với `enrollments` (Restrict trên `courses`), ở đây không có quyền truy cập
-- nào cần giữ lại làm bằng chứng — bằng chứng tiền nong nằm ở `payments`.
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
