---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["components/site-header.tsx","components/site-footer.tsx"]
---

# Trang chủ `/`

**Mode:** Persuade. Liên quan: `components/site-header.tsx`, `components/site-footer.tsx`, `components/sections/*`.

## Đối tượng, việc cần làm, hành động
- Người học nghiên cứu (sinh viên → giảng viên trẻ) đến từ Zalo/Facebook/TikTok/tìm kiếm, mobile và desktop ngang nhau.
- Hành động chính: **đăng ký một khóa sắp khai giảng** (nút ngay trên dòng khóa). Phụ: check Turnitin (tới `/kiem-tra-ai-dao-van`). Thứ ba: tư vấn qua Zalo.
- Bằng chứng: Dr. Tam Trinh có mặt và học vị; số liệu `content/stats.ts` + 500+ học viên; logo đối tác học thuật; hội thảo AGBA/EBES.
- Theo góp ý chủ dự án (lượt 2): khung đầu phải hiện cùng lúc lịch khai giảng, giá check Turnitin và mặt giảng viên.

## Ràng buộc
Trang chủ ngắn (desktop ≤ ~6.000px, mobile ≤ ~7.500px); tiêu đề căn trái; marquee dừng khi hover/focus; giá ưu đãi nổi bật cạnh giá gốc gạch ngang và điều kiện; khóa chưa mở bán ẩn hoàn toàn; khối lịch tự ẩn khi không có khóa mở.

## Direction contract

THESIS: Trang chủ là cuốn chương trình của một hội nghị học thuật mà HDI tổ chức: các khóa là phiên chính có ngày, giờ, giá và nút đăng ký; check Turnitin là phiên song song; Dr. Tam Trinh là diễn giả có thẻ đeo. Từ chối hero chia đôi + lưới thẻ của trang đào tạo.

OWN-WORLD: Giấy trắng in hai màu — mực gần đen `#141821` và navy HDI `#0c498f` — cộng một màu gỉ sét `#b4471a` chỉ cho nhãn phiên song song và vai trò diễn giả; nền phụ `#e8eef6` cho dải phiên song song. Bảng chương trình kẻ ngang: rule 2px mực ở đầu bảng, 1px xám giữa các phiên, không thẻ bo góc. Be Vietnam Pro cho tiêu đề và thân; Archivo hẹp (wdth) cho ngày, giờ, giá, chữ hoa thẻ đeo. Bo góc gần 0, không bóng đổ, không gradient.

STORY: Người đọc thấy ngay đây là chương trình đào tạo nghiên cứu nghiêm túc, ai dẫn dắt và có uy tín gì, khóa nào sắp mở và giá bao nhiêu, rồi bấm Đăng ký trên đúng dòng khóa; ai chỉ cần check Turnitin thấy giá ngay ở phiên song song.

FIRST VIEWPORT: Desktop: cột trái ~62% — nhãn "CHƯƠNG TRÌNH THÁNG 11 – 12/2026", h1 "Huấn luyện nghiên cứu & công bố quốc tế" ~58px, bảng chương trình (Ngày · Phiên chính · Học phí · Đăng ký) các khóa đang mở, rồi dải "SONG SONG" Check Turnitin 50K/20K/60K. Cột phải: dây đeo navy từ mép trên xuống thẻ đeo diễn giả (ảnh, Dr. Tam Trinh, PhD Economics Deakin, nhãn "CỐ VẤN HỌC THUẬT TRƯỞNG"). Nút Đăng ký nằm trên từng dòng khóa. Mobile: h1, thẻ đeo thu thành hàng ngang, rồi bảng chương trình.

FORM: Chương trình hội thảo & thẻ đeo — vị trí 1/7 trong danh sách lượt 3 (IMPECCABLE'S PICK, chủ dự án chọn trên trang quyết định; phác thảo `.impeccable/mocks/decision/r2/pick.html`). seed:2b2be71bdb328f40

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Chưa quyết
- Chuyển động đặc trưng: thẻ đeo đung đưa nhẹ một lần khi tải (tắt khi reduced-motion) hay đứng yên — chốt khi dựng.
- Thứ tự các section dưới khung đầu (hội thảo, về HDI, FAQ, liên hệ) theo dạng "các phần của cuốn chương trình".
