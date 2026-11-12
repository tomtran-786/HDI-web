# Sau redesign (2026-11-12, nhánh claude/website-ux-ui-redesign-fb1aea)

So với `.impeccable/baseline/REPORT.md` (commit 827bae9). ⚠️ DEGRADED: single-context — critique/audit chạy trong một luồng, không tách sub-agent.

## Số đo

| Chỉ số | Trước | Sau |
|---|---|---|
| Chiều cao trang chủ, desktop 1280 | ~8.300 px | 5.543 px |
| Chiều cao trang chủ, mobile 390 | 10.299 px | 7.445 px |
| Hero mobile: dòng khóa đầu tiên | dưới màn thứ hai (sau ảnh lịch) | 661 px — trong màn đầu |
| Tràn ngang 320 / 375 / 390 / 768 / 1280 | không | không |

Detector URL trên đúng 4 trang của baseline (`/`, `/khoa-hoc`, `/gio-hang`, `/kiem-tra-ai-dao-van`):

| | Trước | Sau (có cấu hình) | Sau (`--no-config`) |
|---|---|---|---|
| Desktop | 37 lỗi / 24 advisory | 0 / 0 | 2 / 0 |
| Mobile | 32 lỗi / 24 advisory | 0 / 0 | 1 / 0 |

Hai lỗi còn lại khi chạy thô đều là ngoại lệ có lý do trong `.impeccable/config.json`:
- `marquee` (trang chủ) — dải logo công bố là cam kết thương hiệu của chủ dự án; dừng khi hover/focus.
- `line-length` (`/kiem-tra-ai-dao-van`, `/ve-hdi`) — đo theo ký tự thật 72–75 ký tự/dòng; detector đếm tiếng Việt ở dạng tách dấu (NFD) nên dư ~20%.

Mở rộng: 0 lỗi trên 11 trang công khai và 5 màn xác thực, desktop + mobile. Quét mã nguồn giỏ hàng/thanh toán/tài khoản/quản trị: 0. Không còn chữ < 12px trong `app/` và `components/`.

Mã nguồn: `<Reveal>` không còn animation (vẫn là wrapper trung tính), `eyebrow=` 40 → 0 được vẽ ra, `shadow-[…]` lẻ 19 → 0 (thang 3 mức), `rounded-card` 16px → 4px, nút dùng chung `buttonClass()`.

## Critique — trang chủ (Persuade)

| # | Heuristic | Trước | Sau | Ghi chú |
|---|---|---|---|---|
| 1 | Trạng thái hệ thống | 3 | 3 | Số chỗ thật trên từng dòng khóa |
| 2 | Khớp thế giới thật | 2 | 4 | Headline, bảng chương trình và hành động mua cùng một thông điệp |
| 3 | Kiểm soát | 3 | 3 | — |
| 4 | Nhất quán | 2 | 3 | Một hệ nút, một thang bo góc |
| 5 | Phòng lỗi | 3 | 3 | — |
| 6 | Nhận biết | 3 | 3 | — |
| 7 | Linh hoạt | n/a | n/a | — |
| 8 | Thẩm mỹ tối giản | 1 | 3 | Mỗi section một hình thức; không kicker, không fade-up |
| 9 | Phục hồi lỗi | 3 | 3 | — |
| 10 | Trợ giúp | n/a | n/a | — |
| **Tổng** | | **20/32** | **25/32** | |

## Audit kỹ thuật

| Mảng | Trước | Sau | Ghi chú |
|---|---|---|---|
| Accessibility | 2 | 3 | Chữ ≥ 12px, h1 cho mọi màn xác thực/tài khoản, heading không nhảy cấp, focus-visible toàn cục |
| Performance | 3 | 3 | Bỏ ảnh hero Turnitin và poster PNG khỏi trang chủ; `priority` → `preload` |
| Theming | 2 | 3 | Token light/dark gọn, không wash/glow; còn vài màu cứng trên dải navy |
| Responsive | 3 | 4 | 320–1280 không tràn; hero thu gọn trên mobile |
| Implementation integrity | 1 | 3 | Một thế giới thiết kế có hợp đồng; xem phần "Chưa kiểm" |
| **Tổng** | **11/20** | **16/20** | |

## Chưa kiểm
- Giỏ hàng, thanh toán, khu vực tài khoản và quản trị chưa được xem khi đã đăng nhập (không tạo tài khoản thử trên database thật). Đã kiểm bằng test và quét mã nguồn.
- Trạng thái trang chủ khi không có khóa nào mở chỉ được kiểm bằng test (`tests/home-ia.test.tsx`).
- Finish review của Impeccable chạy trong cùng luồng (không sub-agent độc lập).
