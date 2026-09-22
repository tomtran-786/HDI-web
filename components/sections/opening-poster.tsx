import Image from "next/image";
import type { Course } from "@/content/course";
import { Reveal } from "../ui/reveal";

/**
 * Poster lịch khai giảng, đặt ngay sau Hero — thay cho dải chữ chạy ngang cũ
 * (`OpeningTicker`) và cho bản dựng thẻ động trước đó của chính component này.
 *
 * Đây là MỘT ảnh tĩnh do chủ dự án tự thiết kế và cung cấp (public/images/
 * lich-khai-giang-09-10-2026.png), không phải markup dựng từ `content/course.ts`.
 * Nội dung trong ảnh đã được đối chiếu khớp với dữ liệu khóa học thật tại thời
 * điểm tạo ảnh (lịch từng buổi, học phí, ảnh và chức danh cố vấn học thuật).
 * Vì là ảnh tĩnh, nó KHÔNG tự cập nhật khi lịch học, học phí hay số buổi đổi —
 * đổi ảnh thì phải thay file này và cập nhật lại thủ công.
 *
 * Vẫn nhận `openCourses` chỉ để giữ nguyên cổng ẩn/hiện cũ: không có khóa nào
 * đang bán thì poster cũng phải biến mất, không để lại một ảnh quảng cáo cho
 * những khóa đã đóng.
 */
export function OpeningPoster({
  openCourses,
}: {
  openCourses: { course: Course; remaining: number }[];
}) {
  if (openCourses.length === 0) return null;

  return (
    <section data-opening-poster className="border-t border-line bg-tint">
      <div className="shell py-12 sm:py-16">
        <Reveal>
          <div className="overflow-hidden rounded-card border border-line bg-card shadow-[0_1px_2px_rgba(23,38,56,0.04),0_16px_32px_-16px_rgba(23,38,56,0.18)]">
            <Image
              src="/images/lich-khai-giang-09-10-2026.png"
              alt="Lịch khai giảng các khóa đang mở đăng ký, tháng 09/2026 – 10/2026. AIQT — Nghiên cứu khoa học ứng dụng AI & xuất bản quốc tế: Buổi 1 Thứ Ba 22/09, Buổi 2 Thứ Bảy 26/09, Buổi 3 Thứ Ba 29/09, Buổi 4 Thứ Bảy 03/10, Buổi 5 Thứ Ba 06/10, Buổi 6 Thứ Bảy 10/10/2026. TIEULUAN — Viết tiểu luận, NCKH & khóa luận tốt nghiệp: Buổi 1 Thứ Hai 05/10, Buổi 2 Thứ Hai 12/10, Buổi 3 Thứ Hai 19/10/2026. SPSS — Phân tích định lượng với SPSS, Stata & AI: lịch sẽ thông báo. Cả ba khóa học trực tuyến qua Zoom, học liệu xem lại trong 02 năm. Cố vấn học thuật: Dr. Tam Trinh, PhD in Economics, Deakin University. Zalo tư vấn: 0333443388."
              width={1999}
              height={786}
              sizes="(min-width: 1024px) 72rem, 100vw"
              className="h-auto w-full"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
