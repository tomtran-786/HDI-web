---
name: HDI Research Center
description: Huấn luyện nghiên cứu & công bố quốc tế — site đọc như cuốn chương trình của một hội nghị học thuật.
colors:
  paper: "#ffffff"
  paper-soft: "#f6f7f9"
  ink: "#141821"
  ink-muted: "#464d5b"
  ink-subtle: "#5a6170"
  rule: "#141821"
  hairline: "#d9dde4"
  navy: "#0c498f"
  navy-deep: "#003865"
  band: "#0c3f7a"
  tint: "#e8eef6"
  rust: "#b4471a"
  rust-text: "#9a3a12"
  success: "#1c7a4d"
  warning: "#8f5d00"
  danger: "#b3261e"
  dark-paper: "#0f1319"
  dark-ink: "#eef1f5"
  dark-navy: "#86b6ee"
  dark-rust: "#ec9a72"
typography:
  display:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 800
    lineHeight: 1.06
    letterSpacing: "-0.03em"
  page-title:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.25rem"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  section-title:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.625rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
  figure:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1
  label:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    letterSpacing: "0.06em"
rounded:
  xs: "2px"
  sm: "4px"
  md: "8px"
spacing:
  gutter: "20px"
  shell: "76rem"
  section-y: "80px"
components:
  button-primary:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.paper}"
    rounded: "{rounded.xs}"
    height: "44px"
    padding: "0 20px"
  button-primary-hover:
    backgroundColor: "{colors.navy-deep}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    height: "44px"
    padding: "0 20px"
  button-secondary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  button-on-band:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.band}"
    rounded: "{rounded.xs}"
    height: "48px"
  card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "20px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  status-chip:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.navy}"
    rounded: "9999px"
    padding: "4px 10px"
  parallel-session:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.ink}"
    rounded: "0px"
    padding: "16px 20px"
---

# Design System: HDI Research Center

## Overview

**Creative North Star: "Cuốn chương trình hội nghị"**

HDI-web đọc như cuốn chương trình của một hội nghị học thuật do HDI tổ chức. Các khóa học là phiên chính, mỗi phiên có ngày, giờ, học phí và nút Đăng ký ngay trên dòng. Dịch vụ kiểm tra AI & đạo văn là phiên song song. Cố vấn học thuật xuất hiện trên thẻ đeo diễn giả. Hướng này do chủ dự án chọn trên trang quyết định của Impeccable ngày 2026-11-12, sau ba lượt quay (`.impeccable/surfaces/app-page-tsx.md`).

Bề mặt là giấy trắng in hai màu: mực gần đen cho chữ, navy HDI cho liên kết, nút chính và các dải nhấn. Phân tách bằng đường kẻ và khoảng trắng, không bằng thẻ đổ bóng. Không gradient, không glow, không nền loang, không fade-up hàng loạt khi cuộn.

Ở luồng mua hàng, tài khoản và quản trị, sự rõ ràng và tin cậy đứng trên cá tính: cùng bảng màu và hình khối, nhưng không có chuyển động trang trí.

**Key Characteristics:**
- Bảng chương trình kẻ ngang: rule 2px màu mực ở đầu bảng, hairline 1px giữa các dòng.
- Một font duy nhất, Source Sans 3; số liệu dùng `tabular-nums` để thẳng cột.
- Một màu nhấn duy nhất (gỉ sét) cho nhãn "song song", vai trò diễn giả, số chỗ sắp hết.
- Góc gần như vuông (2–4px); viên thuốc chỉ cho chip trạng thái và ảnh đại diện.
- Tiêu đề căn trái, màu mực; không có nhãn in hoa nhỏ phía trên tiêu đề.

## Colors

### Primary
**Navy HDI** (`#0c498f`, sâu `#003865`): liên kết, nút chính, nền dải `band` (`#0c3f7a`), dây đeo của thẻ diễn giả. Màu thương hiệu, giữ từ trước redesign.

### Secondary
**Gỉ sét** (`#b4471a`, chữ nhỏ `#9a3a12`; dark `#ec9a72`): nhãn "Song song", dải vai trò trên thẻ đeo, số chỗ còn ≤ 5. Không dùng cho nút hay khối lớn.

### Neutral
**Giấy** `#ffffff`, **giấy phụ** `#f6f7f9` (hộp nhỏ, khung tài khoản), **mực** `#141821`, **mực phụ** `#464d5b` / `#5a6170`, **hairline** `#d9dde4`, **tint** `#e8eef6` (dải phiên song song, chip). Dark mode: giấy `#0f1319`, mực `#eef1f5`, navy `#86b6ee`.

### Named Rules
**The One Accent Rule.** Gỉ sét chỉ đánh dấu điều đang khẩn hoặc khác loại (phiên song song, chỗ sắp hết, vai trò). Mọi chữ khác là mực trên giấy.

**The No Glow Rule.** Không gradient, không quầng radial, không bóng màu. Màu phủ thành mảng phẳng (`band`, `tint`) hoặc không có.

## Typography

**Font:** Source Sans 3 (Google Fonts, subset `vietnamese`) cho toàn site — chủ dự án giữ font này khi redesign. Thân bài 17px, line-height 1.6.

### Hierarchy
- **Display** (trang chủ, 56px/800, -0.03em): một tiêu đề duy nhất của trang.
- **Page title** (trang con, 52px/800): h1 của mọi trang con.
- **Section title** (42px/700, -0.02em): h2 các section; màu mực.
- **Body** (17px/400): đoạn văn giới hạn 54–62ch.
- **Figure** (28px/700, `font-cond` = `tabular-nums`): ngày khai giảng, học phí, số liệu.
- **Label** (13px/700, chữ hoa 0.06em): nhãn trường trong form, đầu cột bảng. Không đặt làm "kicker" trên tiêu đề.

### Named Rules
**The 12px Floor.** Không chữ chức năng nào dưới 12px.

**The Heading Speaks Rule.** Không eyebrow trên tiêu đề. Thông tin cần thiết đi vào chính tiêu đề, dòng mô tả, hoặc nhãn của danh sách.

## Layout

Khung `shell` rộng tối đa 76rem, lề 20px. Section `py-14 / sm:py-16 / lg:py-20`, phân tách bằng `border-t` hairline trên cùng một mặt giấy (không nền so le). Trang chủ: hero hai cột `minmax(0,1fr) 17.5rem` (bảng chương trình | thẻ đeo); dưới `lg` thẻ đeo thu thành một hàng ngang đứng trước bảng. Dòng chương trình ba cột (`5.5rem | 1fr | 18rem`) từ `lg`, hai cột ở dưới. Trang chủ giữ ngắn: ≈5.600px desktop, ≈7.500px mobile; danh sách dài nằm ở trang con.

## Elevation & Depth

Thẻ trên trang dùng viền, không dùng bóng. Bóng chỉ cho thứ thật sự nổi khỏi trang:
- `shadow-sm` — `0 1px 2px rgb(20 24 33 / .08)`: nhãn trong menu liên hệ nổi, khung ảnh chứng nhận.
- `shadow-md` — hai lớp, mềm: nút nổi liên hệ, tờ danh sách trên dải navy.
- `shadow-lg` — sâu: dialog, menu thả xuống.

## Shapes

Thang bo góc 2 / 4 / 8px: nút 2px, thẻ và ô nhập 4px, dialog 8px. `rounded-full` chỉ cho chip trạng thái, ảnh đại diện, nút tròn chỉ có icon và ghim bản đồ.

## Components

### Buttons
Nguồn duy nhất: `buttonClass({ variant, size })` trong `components/ui/button.tsx`. `primary` (navy đặc), `secondary` (viền mực, hover đảo màu), `quiet` (liên kết gạch chân), `onBand` (trắng trên dải navy). Cỡ `sm` 36px, `md` 44px, `lg` 48px. Không mũi tên sau nhãn.

### Chips
`Badge`: viên thuốc 12px trên nền `tint` — chỉ cho trạng thái (còn chỗ, hết chỗ, ưu đãi).

### Cards / Containers
`Card`: viền hairline 4px, hover đậm viền sang màu mực, không nâng. Chỉ dành cho thứ bấm được hoặc mua được (thẻ khóa, form báo giá, thẻ giá). Nội dung chỉ để đọc nằm trên khối có `border-t-2` màu mực.

### Inputs / Fields
Viền hairline, bo 4px, nền giấy; focus đổi viền sang navy. Nhãn ở trên, 14px đậm.

### Navigation
Header nền giấy đặc (không kính mờ), mục đang mở có gạch dưới navy 2px. Breadcrumb chữ thường 14px. Một nút nổi duy nhất mở các kênh liên hệ và mục góp ý.

### Bảng chương trình (signature)
`components/programme.tsx`: đầu bảng "Lịch khai giảng tháng …" trên rule 2px; mỗi dòng: ngày + thứ (figure), tên khóa (liên kết), meta (số buổi · giờ · số học viên · còn N chỗ), `PriceTag`, nút Đăng ký. Dòng cuối "Song song" trên nền tint: kiểm tra AI & đạo văn, giá "từ 50K / 20K / 60K".

### Thẻ đeo diễn giả (signature)
Hero trang chủ: dây navy từ mép trên xuống, thẻ viền mực 2px, đầu thẻ navy "HDI Research Center", ảnh cố vấn, tên, học vị, dải gỉ sét "Cố vấn Học thuật Trưởng". Lắc nhẹ một lần khi tải (chỉ từ `lg`, tắt khi giảm chuyển động) — chuyển động đặc trưng duy nhất của trang.

## Do's and Don'ts

### Do:
- **Do** đặt hành động mua (Đăng ký) ngay trên dòng khóa.
- **Do** hiển thị giá ưu đãi to nhất, giá gốc gạch ngang và điều kiện ngay cạnh (`PriceTag`).
- **Do** dùng `buttonClass()` cho mọi nút mới.
- **Do** giới hạn đoạn văn 54–62ch và dùng `tabular-nums` cho cột số.
- **Do** căn trái mọi tiêu đề section.

### Don't:
- **Don't** đặt nhãn in hoa nhỏ phía trên tiêu đề.
- **Don't** dùng gradient, glow, nền loang, ảnh nền mờ sau chữ.
- **Don't** bọc nội dung chỉ để đọc trong thẻ đổ bóng.
- **Don't** thêm fade-up khi cuộn; chuyển động phải có lý do (dialog, phản hồi thao tác, thẻ đeo).
- **Don't** đổi font family; Source Sans 3 là font của thương hiệu.
- **Don't** đặt chữ vào ảnh (poster, banner) — dựng bằng HTML từ `content/`.
