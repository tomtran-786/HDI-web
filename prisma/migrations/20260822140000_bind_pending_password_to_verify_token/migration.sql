-- Mật khẩu của một tài khoản chưa xác thực chuyển từ hàng `users` sang hàng
-- token xác thực đã phát ra nó.
--
-- Lý do là một lỗ hổng chiếm tài khoản: `users.password_hash` được ghi ngay lúc
-- đăng ký, trước khi có ai chứng minh sở hữu hộp thư. Kẻ đăng ký chèn địa chỉ
-- của người khác đặt được mật khẩu, rồi chính chủ hộp thư bấm liên kết xác thực
-- và kích hoạt tài khoản với mật khẩu của kẻ đó. Buộc mật khẩu vào token khiến
-- liên kết nào được bấm thì mật khẩu đi cùng lần đăng ký đó mới có hiệu lực.
ALTER TABLE "verification_tokens"
  ADD COLUMN "pending_password_hash" VARCHAR(100);

-- Các token đã phát trước migration này mang giá trị NULL. Ứng dụng chỉ ghi đè
-- `users.password_hash` khi cột dưới đây khác NULL, nên những lượt đăng ký đang
-- chờ xác thực vẫn xác thực được và vẫn giữ đúng mật khẩu cũ của chúng.
