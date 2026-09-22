import { Hero } from "@/components/sections/hero";
import { OpenCourses } from "@/components/sections/open-courses";
import { ConferenceProgram } from "@/components/sections/conference-program";
import { Services } from "@/components/sections/services";
import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { Faq } from "@/components/sections/faq";

export default async function Home() {
  const openCourses = await OpenCourses();
  /**
   * Nhịp nền so le được TÍNH ra, không cắm cứng vào từng section.
   *
   * `OpenCourses` tự ẩn khi không có khóa nào đang mở
   * (components/sections/open-courses.tsx), nên không có bộ cờ cố định nào đúng
   * cho cả hai trạng thái: cắm cứng `soft` vào từng component thì hoặc là hai
   * dải `soft` dính liền nhau khi có khóa, hoặc hai dải thường dính nhau khi
   * không. Khối khóa học là dải `soft` đầu tiên sau Hero khi nó hiện, nên cả
   * dãy dưới lật một nhịp theo chính nó.
   *
   * Hồ sơ học thuật (công bố, dự án, hội thảo, hướng dẫn) cùng bốn con số tóm
   * tắt nằm ở trang riêng /cong-bo; hội thảo quốc tế chỉ để teaser ở đây, chi
   * tiết ở /hoi-thao-quoc-te.
   */
  const hasCourses = openCourses !== null;

  return (
    <>
      <Hero />
      {openCourses}
      <ConferenceProgram soft={!hasCourses} />
      <About soft={hasCourses} />
      <Services soft={!hasCourses} />
      <Faq soft={hasCourses} />
      <Contact soft={!hasCourses} />
    </>
  );
}
