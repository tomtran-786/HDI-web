# HDI Research Center — kiến trúc cart/order

Tài liệu này mô tả luồng bán khóa học hiện hành. Khái niệm `Cohort`/kỳ học và
hai trang `/dang-ky/[slug]`, `/gio-hang` đã được loại bỏ.

## Luồng học viên

1. Landing `/` được prerender tĩnh. Header và modal chi tiết khóa đều mở chung
   `CartModal`; không điều hướng sang một trang chọn khóa khác.
2. Catalog bán hàng chỉ được tải khi modal mở qua `GET /api/gio-hang` với
   `Cache-Control: private, no-store`.
3. Chưa đăng nhập nhận `401`; hồ sơ chưa đủ `phone` và `stage` nhận `409`.
   Client đi qua đăng nhập/hoàn tất hồ sơ với return path
   `/?cart=1&course=<slug>`. Luồng tạo tài khoản và xác thực email giữ nguyên
   return path này.
4. Khi trở lại landing, cart tự mở, ưu tiên khóa tương ứng rồi xóa `cart` và
   `course` khỏi URL bằng History API.
5. Modal hiển thị tất cả khóa marketing. Một khóa chỉ chọn được khi có cấu hình
   DB, `status = open`, còn chỗ và người dùng chưa có đơn/quyền hiện tại.
6. Cookie chỉ chứa tập `Course.id`; không chứa giá. Khóa đã đóng, hết chỗ,
   không còn tồn tại hoặc không còn hợp lệ được bỏ khỏi cookie và tổng tiền.
7. Modal có đúng một hành động cuối: `Thanh toán · <tổng tiền>`. Server tạo một
   đơn cho toàn bộ giỏ rồi chuyển thẳng tới PayOS. Nếu PayOS chưa trả URL, học
   viên được chuyển tới chi tiết đơn hiện có.

Các URL cũ `/dang-ky/*` và `/gio-hang` không có route thay thế và trả 404.

## Mô hình dữ liệu

`Course` là một sản phẩm và chính sách truy cập cố định:

- `slug` duy nhất, khớp với `content/course.ts`;
- `priceVnd`, `capacity`, `status`;
- secret `meetingUrl`, `driveFolderId`;
- `accessDays`, dùng để tính `accessExpiresAt = paidAt + accessDays`.

Migration `20260821190113_replace_cohorts_with_courses` đổi tên bảng/cột/enum
tại chỗ để bảo toàn ID, order, payment và enrollment lịch sử. Migration chạy
preflight trước mọi thay đổi và dừng với danh sách slug nếu nhiều cohort cũ có
cùng `course_slug`. Không tự gộp dữ liệu.

Seed đọc `prisma/courses.json` (gitignore), mỗi slug tối đa một dòng. Mẫu nằm ở
`prisma/courses.example.json`. Khóa marketing không có dòng DB hoặc không ở
trạng thái `open` được coi là chưa mở đăng ký.

## Quy tắc giữ chỗ và quyền truy cập

Mỗi lần mua là một `Enrollment` mới để giữ nguyên lịch sử. Partial unique index
`enrollments_user_id_course_id_active_key` chặn đồng thời:

- enrollment `pending`;
- enrollment `paid` có `accessRevokedAt IS NULL`.

Sau khi cron thu hồi quyền Drive thành công và ghi `accessRevokedAt`, cùng học
viên có thể mua lại khóa đó. Chỉ riêng việc qua `accessExpiresAt` không nhả ghế.
Nếu Drive revoke lỗi, enrollment vẫn chưa revoke và ghế vẫn bị giữ.

Ghế được tính từ enrollment đang giữ chỗ/quyền, không phải tổng lịch sử. Các
truy vấn sức chứa không chọn hoặc trả `meetingUrl`/`driveFolderId`.

## Checkout nguyên tử

`createOrder(userId, courseIds)`:

1. Từ chối giỏ rỗng và loại ID trùng.
2. Khóa các dòng `courses` theo thứ tự ID ổn định bằng `FOR UPDATE`.
3. Tính lại trạng thái, giá, quyền hiện tại và số ghế hoàn toàn ở server.
4. Xác thực toàn bộ basket trước khi ghi dòng nào.
5. Tạo enrollment mới, order và các item snapshot trong cùng transaction.

Nếu một khóa vừa đóng, hết chỗ, bị xóa hoặc người dùng đã có quyền/đơn pending,
toàn bộ checkout thất bại; không có đơn thiếu món. `OrderItem.priceVnd` là giá
snapshot để đơn lịch sử không đổi khi giá khóa hiện tại thay đổi.

Không gọi PayOS trong transaction đang giữ khóa DB. Sau khi tạo order, hệ thống
tạo/reuse hosted link. Cookie chỉ được xóa khi đã có URL PayOS hoặc một chi tiết
đơn an toàn để quay lại.

## Bảo mật

- `courses` bật RLS và revoke mọi quyền của `anon`, `authenticated` như các bảng
  nội bộ khác; Prisma dùng kết nối server-side.
- API cart dùng projection công khai rõ ràng: `id`, `slug`, `title`, `priceVnd`,
  `capacity`, `seatsLeft`, `availability`, cùng `staleIds`.
- Link lớp và Drive chỉ được query ở trang tài khoản cho enrollment paid còn
  hiệu lực.
- Giá/tổng tiền từ client không được chấp nhận.
- Return path qua auth luôn đi qua `safeNext` để chặn open redirect.

## Màn hình vận hành

- Tài khoản hiển thị từng lần mua riêng: khóa, ngày thanh toán/đặt chỗ, hạn truy
  cập và link cố định khi còn quyền. Lịch sử hết quyền vẫn còn.
- Danh sách/chi tiết đơn và PayOS item dùng `Course.slug`; giao diện đơn dùng giá
  snapshot ở `OrderItem`.
- Quản trị hiển thị giá, sức chứa, số ghế đang bị chiếm, cấu hình link/Drive và
  cho đổi `CourseStatus` giữa `draft`, `open`, `running`, `closed`.
- Analytics giữ sự kiện mở lộ trình, thêm/bỏ giỏ, checkout; số lượng được ghi là
  `so_khoa`, không còn thuộc tính `ky`.

## Kiểm chứng

Các lệnh chuẩn:

```bash
npx prisma generate
npx tsc --noEmit
npm test
npm run test:integration
npm run lint
npm run build -- --webpack
```

Integration runner chỉ chạy khi có `TEST_DATABASE_URL` riêng và
`HDI_TEST_DATABASE_CONFIRM_DISPOSABLE=1`; nó từ chối URL production. Bộ test DB
kiểm tra cạnh tranh ghế cuối, basket all-or-nothing, partial unique index,
RLS/revoke, foreign-key indexes và mua lại sau revoke.

Tiêu chí build:

- `/` xuất hiện là route `○` (static);
- `/api/gio-hang` và các màn hình tài khoản/quản trị là dynamic;
- không có `/dang-ky/[slug]` hoặc `/gio-hang` trong route manifest;
- modal native `<dialog>` có focus trap, Esc, backdrop, giới hạn chiều cao,
  mobile/desktop, dark mode và không làm trang tràn ngang.
