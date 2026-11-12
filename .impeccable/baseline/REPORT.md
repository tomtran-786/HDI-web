# Baseline trước redesign (2026-11-12, commit 827bae9)

⚠️ DEGRADED: single-context — critique chạy trong một luồng, không tách hai sub-agent như Impeccable khuyến nghị (chưa được yêu cầu dùng sub-agent). Giỏ hàng cần đăng nhập nên chỉ xét từ mã nguồn.

## Số đo

| Chỉ số | Desktop 1280 | Mobile 390 |
|---|---|---|
| Chiều cao trang chủ | ~8.300 px (8.255 ở 1024) | 10.299 px |
| Hero (`#top`) | 1.202 px | 1.331 px (~1,6 màn hình) |
| Tràn ngang | không | không |

Detector URL (`impeccable detect`, lỗi tính điểm / advisory) — file JSON cùng thư mục:

| Trang | Desktop | Mobile |
|---|---|---|
| `/` | 16 / 19 | 14 / 19 |
| `/khoa-hoc` | 10 / 2 | 9 / 2 |
| `/gio-hang` (→ đăng nhập) | 2 / 0 | 2 / 1 |
| `/kiem-tra-ai-dao-van` | 9 / 3 | 7 / 2 |
| **Tổng** | **37** | **32** |

Theo luật: kicker-above-heading 11, tiny-text 8, undersized-ui-text 6, dark-glow 4, line-length 5, marquee 1, radial-halo 1, skipped-heading 1. Detector trên mã nguồn: 0 (chỉ chạy được luật regex). Advisory đáng chú ý: easing nảy `cubic-bezier(0.34,1.56,0.64,1)` lặp 14 lần, "Còn N chỗ" tương phản 4,4:1.

`marquee` là dương tính có chủ đích: dải logo là cam kết thương hiệu (dừng khi hover/focus) — sẽ ignore kèm lý do.

Mã nguồn: 71 `<Reveal>`, 40 `eyebrow=`, 149 `rounded-full`, 120 `rounded-card`, 19 giá trị `shadow-[…]` riêng lẻ, 61 chỗ `text-[10px]`/`text-[11px]`.

## Critique — trang chủ (Persuade)

| # | Heuristic | Điểm | Vấn đề chính |
|---|---|---|---|
| 1 | Trạng thái hệ thống | 3 | Số chỗ còn lại hiện trên thẻ khóa |
| 2 | Khớp thế giới thật | 2 | Headline nói huấn luyện nghiên cứu, ảnh bên phải quảng cáo Turnitin |
| 3 | Kiểm soát | 3 | — |
| 4 | Nhất quán | 2 | Pill, thẻ bo 16px, nút tròn và nút vuông trộn lẫn |
| 5 | Phòng lỗi | 3 | — |
| 6 | Nhận biết | 3 | — |
| 7 | Linh hoạt | n/a | Trang thuyết phục |
| 8 | Thẩm mỹ tối giản | 1 | Hero 7 khối; mọi section cùng khuôn eyebrow→h2→lưới thẻ; fade-up và nét vẽ tay khắp nơi |
| 9 | Phục hồi lỗi | 3 | — |
| 10 | Trợ giúp | n/a | Trang thuyết phục |
| **Tổng** | | **20/32** | Acceptable |

**Độ riêng của thiết kế:** thấp. Bỏ logo và chữ đi thì trang thay được cho bất kỳ trung tâm đào tạo nào: hero chia đôi, dải logo, lưới thẻ, FAQ accordion, khối liên hệ.

**Vấn đề ưu tiên**
- **[P1] Thông điệp hero lệch hành động số 1.** Chủ dự án chốt mua khóa là ưu tiên; hero đưa "Đăng ký tư vấn" làm nút chính và ảnh Turnitin làm điểm nhìn. → `shape`/`distill`.
- **[P1] Chữ nằm trong ảnh.** Ảnh Turnitin và lịch khai giảng là PNG/JPG có chữ: không đọc được bằng trình đọc màn hình, không cập nhật từ `content/`, mờ trên mobile. → dựng lại bằng HTML.
- **[P1] Nhịp đơn điệu.** 6 kicker in hoa trên 6 h2 liên tiếp, nền so le trắng/xám, cùng `py`, cùng `border-t`. → `layout`, `quieter`.
- **[P2] Chữ quá nhỏ.** 61 chỗ 10–11px (meta thẻ khóa, cam kết hero, nhãn giá). → `typeset`.
- **[P2] Lặp nội dung.** Khối Hội thảo có hai đoạn gần trùng nhau ("HDI đồng hành cùng nghiên cứu sinh…"). → `clarify`.

**Persona**
- *Học viên cao học đang so khóa (người dùng chính)*: phải cuộn qua ~1,5 màn hình hero rồi một ảnh lịch khai giảng mới tới thẻ khóa có giá; giá ưu đãi và điều kiện ở cỡ 10px.
- *Casey (mobile, đến từ Zalo)*: hero 1.331px, 3 cam kết + hồ sơ cố vấn đẩy thẻ khóa xuống dưới màn thứ hai; ảnh lịch khai giảng chữ quá nhỏ để đọc.
- *Sam (trình đọc màn hình)*: thông tin giá Turnitin và lịch học chỉ có trong `alt` dài của ảnh.

## Audit kỹ thuật

| # | Mảng | Điểm | Phát hiện chính |
|---|---|---|---|
| 1 | Accessibility | 2 | 61 chỗ chữ 10–11px; "Còn N chỗ" 4,4:1; heading nhảy cấp ở `/khoa-hoc`; chữ trong ảnh |
| 2 | Performance | 3 | `next/image` dùng đúng; ảnh hero 1675px có chữ được `priority` |
| 3 | Theming | 2 | Có token và dark mode, nhưng `--bg-soft` = `--bg` ở light, 19 shadow lẻ, glow màu ở dark |
| 4 | Responsive | 3 | Không tràn ngang; trang mobile dài 10.3k px |
| 5 | Implementation integrity | 1 | Khuôn section lặp, kicker toàn trang, ảnh quảng cáo thay nội dung |
| **Tổng** | | **11/20** | Acceptable |
