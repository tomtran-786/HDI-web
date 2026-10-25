import Link from "next/link";
import { courses } from "@/content/course";
import { landingCourseData } from "@/lib/course-sales";
import { CourseCard } from "../course-card";
import { OpeningPoster } from "./opening-poster";
import { IconArrow } from "../ui/icons";
import { Reveal } from "../ui/reveal";
import { Section, SectionHeading } from "../ui/section";

async function readOpenCourses() {
  try {
    const { availability, seatsLeft } = await landingCourseData();
    return courses.flatMap((course) => {
      const remaining = seatsLeft[course.slug];
      return availability[course.slug] === "buyable" && remaining > 0
        ? [{ course, remaining }]
        : [];
    });
  } catch (error) {
    // Không dựng số ghế giả khi Supabase tạm thời không đọc được. Trang khóa
    // học và checkout vẫn có cơ chế fail-open/live validation riêng của chúng.
    console.error("[home-open-courses] Không đọc được số chỗ:", error);
    return [];
  }
}

/**
 * Chỉ hiện các khóa thực sự đang nhận đăng ký và còn ít nhất một chỗ.
 *
 * Trả về HAI khối: poster lịch khai giảng, rồi mới tới danh sách thẻ. Cùng một
 * `openCourses` nuôi cả hai, nên không có trạng thái nào mà poster quảng cáo
 * một khóa còn bên dưới không có thẻ nào — kể cả khi Supabase lỗi và
 * `readOpenCourses` trả về mảng rỗng. Tách poster ra `app/page.tsx` thì nó
 * phải tự đọc dữ liệu lần nữa và tự bắt lỗi lần nữa, và hai nhánh catch sẽ có
 * ngày lệch nhau.
 */
export async function OpenCourses() {
  const openCourses = await readOpenCourses();
  if (openCourses.length === 0) return null;

  return (
    <>
      <OpeningPoster openCourses={openCourses} />
      <Section id="khoa-hoc" soft>
        <SectionHeading
          eyebrow="Đang mở đăng ký"
          title="Khóa học đang nhận học viên"
          mark={{ text: "đang nhận", type: "circle" }}
          subtitle="Số chỗ được tính từ các lượt giữ chỗ còn hạn và ghi danh đã thanh toán."
        />

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {openCourses.map(({ course, remaining }, index) => (
            <Reveal key={course.slug} delay={index * 70} className="h-full">
              <CourseCard
                course={course}
                availability="buyable"
                seatsLeft={remaining}
                ctaSource="home-open-courses"
              />
            </Reveal>
          ))}
        </div>

        <Reveal>
          <Link
            href="/khoa-hoc"
            className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
          >
            Xem tất cả khóa học
            <IconArrow size={15} />
          </Link>
        </Reveal>
      </Section>
    </>
  );
}
