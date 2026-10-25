/**
 * Chữ cho việc ẩn khóa chưa mở bán khỏi front-end (lib/course-availability.ts,
 * `isListed`). Khách không thấy khóa `not_open` ở bất cứ đâu và trang chi tiết
 * của nó trả 404; chỉ admin còn xem được trang đó, kèm banner dưới đây.
 */
export const courseVisibility = {
  adminBanner:
    "Khóa này đang ẩn với khách: chưa mở bán nên không hiện ở danh sách, menu và sitemap, còn khách vào trang này sẽ thấy 404. Chỉ tài khoản admin xem được để duyệt trước khi mở.",
  listEmpty: {
    title: "Hiện chưa có khóa học nào mở đăng ký",
    body: "Lịch khai giảng mới sẽ được cập nhật tại đây. Bạn có thể để lại nhu cầu, đội ngũ HDI sẽ tư vấn lộ trình phù hợp và báo ngay khi khóa mở.",
  },
} as const;
