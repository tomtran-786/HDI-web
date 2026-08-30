/**
 * Quy tắc ô nhập email thành viên trong giỏ hàng — hàm thuần, không chạm
 * database, để client component import được.
 *
 * Tồn tại vì client và server TỪNG đếm số người theo hai quy tắc khác nhau.
 * `normalizeMemberEmails` (lib/group-members.ts) bỏ im lặng email của chính
 * nhóm trưởng; ô nhập phía trình duyệt thì không, nên nhóm trưởng gõ nhầm địa
 * chỉ của mình vào là client tưởng nhóm đông hơn server một người. Hậu quả
 * không phải một dòng chữ lệch: `preview.groupSize` không bao giờ khớp nữa nên
 * mọi cảnh báo về thành viên bị nuốt, và `tongTienDuKien` lệch với số tiền
 * `createOrder` tính ra nên đơn vừa tạo bị hủy ngay kèm một thông báo mà người
 * mua không có cách nào sửa.
 *
 * Vì vậy hai bên phải dùng chung `normalizeEmail` và chung định nghĩa "địa chỉ
 * này có phải một ghế mới không". Chỗ CỐ Ý khác nhau là cách xử lý đầu vào hỏng:
 * ở đây gõ dở dang là chuyện bình thường nên email sai bị bỏ qua và danh sách bị
 * cắt ở trần; ở server, lúc bấm thanh toán, cả hai đều là lỗi phải nói ra.
 */
import { GROUP_MAX_SIZE } from "./group-pricing";
import { normalizeEmail } from "./normalize-email";

/** Nhiều nhất bao nhiêu người NGOÀI nhóm trưởng. Nhóm trưởng đã là một ghế. */
export const MAX_MEMBERS = GROUP_MAX_SIZE - 1;

/**
 * Thêm những gì vừa gõ vào danh sách thành viên đang có.
 *
 * `raw` là nguyên văn ô nhập: người dùng dán cả một danh sách ngăn bằng dấu
 * phẩy, chấm phẩy hay xuống dòng cũng phải ra đúng từng địa chỉ.
 *
 * Trả về mảng MỚI khi có thay đổi và trả về chính `current` khi không — để
 * `setState` không dựng một render thừa cho mỗi lần blur vào ô trống.
 */
export function addMemberEmails(
  current: string[],
  raw: string,
  leaderEmail: string,
): string[] {
  const leader = normalizeEmail(leaderEmail);
  const next = [...current];

  for (const part of raw.split(/[,;\s]+/)) {
    const email = normalizeEmail(part);
    if (!email) continue;
    // Nhóm trưởng đã là một ghế trong nhóm. Server bỏ địa chỉ này đi, nên giữ
    // lại ở đây là tự tạo ra chênh lệch giữa hai bên.
    if (email === leader) continue;
    if (next.includes(email)) continue;
    if (next.length >= MAX_MEMBERS) break;
    next.push(email);
  }

  return next.length === current.length ? current : next;
}

/**
 * Nhóm hiện tại có còn hiệu lực với giỏ hàng này không.
 *
 * "Còn hiệu lực" nghĩa là giỏ có ÍT NHẤT một khóa hưởng ưu đãi nhóm — không
 * phải tất cả: giỏ trộn một khóa có ưu đãi với một khóa không có là hợp lệ, mỗi
 * khóa tính theo cấu hình của chính nó.
 *
 * Cùng một câu hỏi được hỏi ở hai nơi và phải cho cùng một câu trả lời: giỏ hàng
 * dùng nó để bỏ danh sách thành viên khi khóa có ưu đãi rời giỏ, còn `createOrder`
 * dùng nó để từ chối một đơn nhóm mà giỏ không hề mời nhóm — thanh toán nhóm chỉ
 * được quảng cáo như một cơ chế giảm giá, nên "mua hộ nhiều người giá lẻ" không
 * phải một luồng có thật, nó là dấu hiệu client đã sai.
 */
export function groupApplies(memberCount: number, anyGroupEligible: boolean) {
  return memberCount === 0 || anyGroupEligible;
}
