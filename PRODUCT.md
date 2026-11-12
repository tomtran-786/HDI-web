# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Người học nghiên cứu ở Việt Nam, đang ở một chặng cụ thể của hành trình từ ý tưởng đến bài báo được đăng:

- **Sinh viên** — viết tiểu luận, nghiên cứu khoa học, khóa luận tốt nghiệp.
- **Học viên cao học, nghiên cứu sinh** — chọn phương pháp, phân tích dữ liệu (SPSS, Stata), viết luận văn và bản thảo.
- **Giảng viên, nhà nghiên cứu trẻ** — viết bài tạp chí trong nước và quốc tế, chuẩn bị công bố, trả lời phản biện.

Họ đến từ Zalo, Facebook, TikTok lẫn tìm kiếm; mobile và desktop ngang nhau (chủ dự án xác nhận). Thường đọc kỹ trước khi trả tiền: xem ai dạy, dạy gì, khi nào khai giảng, giá bao nhiêu, có ưu đãi gì.

## Product Purpose

HDI Research Center huấn luyện nghiên cứu và công bố quốc tế. Website vừa là hồ sơ học thuật của trung tâm, vừa là nơi bán khóa học có giới hạn chỗ và dịch vụ kiểm tra AI/đạo văn (Turnitin) theo đơn.

Thành công, theo thứ tự ưu tiên chủ dự án đã chốt:

1. **Mua khóa học** — hành động kinh doanh số 1; CTA chính của trang chủ.
2. Đăng ký tư vấn (Zalo, email, điện thoại).
3. Đặt đơn kiểm tra AI/đạo văn.

Sau khi mua: học viên vào `/tai-khoan` để lấy link lớp, nhóm, kho record trên Google Drive, xem đơn và gửi đánh giá. Quản trị viên vận hành ở `/quan-tri`.

## Positioning

Một trung tâm có hồ sơ công bố quốc tế thật đứng sau: Cố vấn Học thuật Trưởng **Dr. Tam Trinh** (PhD in Economics, Deakin University), 25+ công bố quốc tế, 15+ hội thảo quốc tế, US$37.300 tài trợ nghiên cứu, 10+ năm nghiên cứu và giảng dạy, thành viên ban biên tập Eurasian Economic Review. HDI đồng hành từ câu hỏi nghiên cứu đến khi gửi bài và trả lời phản biện — không chỉ dạy công cụ.

HDI là trung tâm, không phải một cá nhân: tên và vai trò cố vấn luôn đi cùng nhau (`site.lead` trong `content/site.ts`).

## Operating Context

- Khóa học mở theo đợt, có ngày khai giảng (`opening.startDate`), số buổi, học phí, ưu đãi theo điều kiện; số chỗ giới hạn và giữ chỗ 2 giờ khi tạo đơn.
- Thanh toán qua PayOS (QR chuyển khoản); học liệu cấp qua Google Drive theo email.
- Đơn kiểm tra AI/đạo văn: chọn loại → nhập số từ → báo giá → thanh toán → gửi bản thảo qua Zalo kèm mã đơn.
- Tư vấn chủ yếu qua Zalo (`contact.phoneNote`: "Ưu tiên liên hệ qua Zalo").
- Toàn bộ nội dung bằng tiếng Việt; tên đơn vị học thuật quốc tế giữ nguyên tiếng Anh.

## Capabilities and Constraints

- Next.js 16 (App Router) + PostgreSQL/Prisma, Tailwind 4, NextAuth, PayOS, Google Drive API; deploy Vercel Hobby (cron tối đa 1 lần/ngày).
- Nội dung có cấu trúc trong `content/*.ts`; giá khóa và dịch vụ tính lại ở server từ cùng nguồn dữ liệu đang hiển thị.
- Mọi thứ có thu tiền đều yêu cầu đăng nhập.
- Ưu đãi không cộng dồn — một đơn chỉ hưởng mức giảm cao nhất. Giá sau giảm hiển thị nổi bật, cạnh giá gốc gạch ngang, điều kiện ưu đãi đứng ngay cạnh.
- Hoa hồng giới thiệu chỉ trả cho người thanh toán đơn.
- Khóa chưa mở bán bị ẩn hoàn toàn (404, danh sách, menu, thẻ, modal, sitemap, giỏ).
- Mọi khóa trong `content/course.ts` có cùng một bộ trường.
- Khu vực học viên chỉ hiện đơn còn sống.
- Có dark mode.

## Brand Commitments

- Tên: **HDI Research Center** (viết tắt HDI); tagline "Huấn luyện nghiên cứu & công bố quốc tế".
- Logo: `public/images/logo.webp`, `public/images/logo-mark.png`.
- Màu thương hiệu navy HDI (`#0c498f`, `#003865`) — giữ.
- Giọng: tiếng Việt chuẩn mực, học thuật nhưng gần gũi; nói "bạn"; không phóng đại.
- Trang chủ ngắn; danh sách dài nằm ở trang con.
- Tiêu đề section căn trái, không căn giữa.
- Dải logo chạy (marquee) dừng khi hover/focus, không có nút pause riêng.

## Evidence on Hand

- Số liệu đếm từ nội dung: `content/stats.ts` (25+ công bố, 15+ hội thảo, US$37.300 tài trợ, 10+ năm).
- "Đồng hành cùng 500+ học viên & nghiên cứu sinh" — chủ dự án xác nhận là số thật.
- Hồ sơ cố vấn, ảnh hoạt động hội thảo có chú thích: `content/about.ts`, `public/images/hoat-dong/`.
- Công bố, dự án, giảng dạy: `content/publications.ts`, `projects.ts`, `teaching.ts`; hội thảo: `conferences.ts`, `conference-program.ts`, `conference-map.ts`.
- Logo nhà xuất bản và đơn vị học thuật: `content/credibility-logos.ts`, `public/images/logos/`.
- Giấy chứng nhận mẫu: `public/images/chung-nhan-mau.jpg`, `content/certificate.ts`.
- Bảng giá kiểm tra AI/đạo văn: `content/ai-check.ts` (chỉ bậc đầu là số gốc của HDI).
- Đánh giá học viên: đi qua kiểm duyệt trong `/quan-tri`; không bịa thêm lời chứng thực, tên khách hàng hay số liệu.
- CV và teaching statement: `public/docs/`.

## Product Principles

1. **Hồ sơ thật là lời chào hàng.** Uy tín đến từ công bố, hội thảo, người dạy có tên — không từ tính từ quảng cáo.
2. **Đi thẳng tới khóa học.** Người đọc phải thấy ngay khóa nào sắp khai giảng, học gì, bao giờ, giá bao nhiêu.
3. **Giá minh bạch.** Giá, ưu đãi và điều kiện luôn đọc được cùng lúc; không có bất ngờ ở bước thanh toán.
4. **Ngắn ở trang chủ, đầy đủ ở trang con.**
5. **Luồng tiền phải đáng tin hơn là đẹp.** Ở giỏ hàng, thanh toán, tài khoản: rõ ràng, trạng thái chính xác, không trang trí.

## Accessibility & Inclusion

- Tiếng Việt có dấu chồng (ề, ữ, ậ): mọi font phải có subset `vietnamese` và hiển thị đúng dấu.
- Tôn trọng `prefers-reduced-motion`; điều khiển bàn phím đầy đủ; tương phản WCAG AA ở cả light và dark.
