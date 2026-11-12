import { Hero } from "@/components/sections/hero";
import { ConferenceProgram } from "@/components/sections/conference-program";
import { Services } from "@/components/sections/services";
import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { Faq } from "@/components/sections/faq";
import { readOpenCourses } from "@/lib/open-courses";

/**
 * Trang chủ đọc như một cuốn chương trình hội nghị
 * (.impeccable/surfaces/app-page-tsx.md):
 *
 *   1. Hero — tiêu đề, bảng chương trình (khóa đang mở + phiên song song
 *      kiểm tra AI & đạo văn), thẻ đeo cố vấn, dải logo công bố.
 *   2. Hội thảo quốc tế — ảnh lớn và hai diễn đàn dạng danh sách.
 *   3. Về HDI — đoạn giới thiệu và bản đồ hội thảo.
 *   4. Dịch vụ — hai nhóm dạng hai cột kẻ.
 *   5. Câu hỏi thường gặp.
 *   6. Liên hệ — phần kết.
 *
 * Mọi section cùng nằm trên một mặt giấy, phân tách bằng đường kẻ; không còn
 * nhịp nền so le. Danh sách dài (công bố, toàn bộ khóa, đội ngũ) nằm ở trang con.
 */
export default async function Home() {
  const open = await readOpenCourses();
  return (
    <>
      <Hero open={open} />
      <ConferenceProgram />
      <About />
      <Services />
      <Faq />
      <Contact />
    </>
  );
}
