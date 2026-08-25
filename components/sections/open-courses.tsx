import Link from "next/link";
import { courses } from "@/content/course";
import { landingCourseData } from "@/lib/course-sales";
import { OpenCourseEnrollButton } from "../open-course-enroll-button";
import { Card } from "../ui/card";
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

/** Chỉ hiện các khóa thực sự đang nhận đăng ký và còn ít nhất một chỗ. */
export async function OpenCourses() {
  const openCourses = await readOpenCourses();
  if (openCourses.length === 0) return null;

  return (
    <Section id="khoa-hoc" soft>
      <SectionHeading
        eyebrow="Đang mở đăng ký"
        title="Khóa học đang nhận học viên"
        subtitle="Số chỗ được tính từ các lượt giữ chỗ còn hạn và ghi danh đã thanh toán."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {openCourses.map(({ course, remaining }, index) => {
          const opening = course.facts.find((fact) => fact.label === "Khai giảng");
          const format = course.facts.find((fact) => fact.label === "Hình thức");
          return (
            <Reveal key={course.slug} delay={index * 70} className="h-full">
              <Card className="flex h-full flex-col p-6 sm:p-8" hover={false}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                      Mã khóa {course.code} · {course.eyebrow}
                    </p>
                    <h3 className="mt-2 text-xl font-bold leading-snug text-fg sm:text-2xl">
                      {course.title}
                    </h3>
                  </div>
                  <span className="inline-flex shrink-0 rounded-full bg-tint px-3 py-1.5 text-sm font-bold tabular-nums text-success">
                    Còn {remaining} chỗ
                  </span>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-fg-muted sm:text-base">
                  {course.audience}
                </p>

                <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                  {opening && (
                    <div className="rounded-card border border-line bg-bg-soft px-4 py-3">
                      <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                        {opening.label}
                      </dt>
                      <dd className="mt-1 text-sm font-bold text-fg">{opening.value}</dd>
                    </div>
                  )}
                  {format && (
                    <div className="rounded-card border border-line bg-bg-soft px-4 py-3">
                      <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                        {format.label}
                      </dt>
                      <dd className="mt-1 text-sm font-bold text-fg">{format.value}</dd>
                    </div>
                  )}
                </dl>

                <div className="mt-6 border-t border-line pt-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                    Học phí
                  </p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-primary">
                    {course.price.amount}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-success">
                    {course.price.note}
                  </p>
                </div>

                <div className="mt-auto flex flex-wrap gap-3 pt-6">
                  <OpenCourseEnrollButton slug={course.slug} />
                  <Link
                    href={`/khoa-hoc/${course.slug}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
                  >
                    Xem chi tiết
                    <IconArrow size={15} />
                  </Link>
                </div>
              </Card>
            </Reveal>
          );
        })}
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
  );
}
