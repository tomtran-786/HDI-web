/**
 * Biến môi trường tối thiểu để các module tầng server nạp được trong unit test.
 *
 * lib/prisma.ts THROW khi thiếu DATABASE_URL — cố ý, để một deploy cấu hình sai
 * gãy ngay lúc build thay vì rải lỗi truy vấn lên production. Unit test lại
 * import gián tiếp các module đó (qua lib/orders, lib/service-orders…) rồi mock
 * Prisma ở biên, nên chúng cần một chuỗi kết nối có hình dạng đúng mà không bao
 * giờ được mở.
 *
 * Host là địa chỉ không định tuyến được, không phải một database thật: nếu có
 * chỗ nào lỡ mở kết nối thật thì test phải gãy, chứ không được lặng lẽ đi ra
 * ngoài mạng.
 */
process.env.DATABASE_URL ??=
  "postgresql://test:test@127.0.0.1:1/hdi_unit_test_never_connected";
