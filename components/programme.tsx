import Link from "next/link";
import { enrolledCount, enrolledLabel } from "@/content/course-hype";
import type { CtaSource } from "@/lib/analytics";
import { formatCount } from "@/lib/format";
import {
  openingParts,
  programmeOrder,
  programmeSpan,
  sessionTime,
  todayInVietnam,
  type OpenCourse,
} from "@/lib/open-courses";
import { AiCheckTeaser } from "./ai-check-teaser";
import { EnrollButton } from "./enroll-button";
import { factValue } from "./course-facts";
import { PriceTag } from "./ui/price-tag";

/** Dưới ngưỡng này số chỗ còn lại đổi sang màu nhấn. */
const FEW_SEATS = 5;

/**
 * Bảng chương trình: mỗi khóa đang mở là một "phiên chính" — ngày khai giảng,
 * tên khóa, thời lượng, học phí và nút Đăng ký ngay trên dòng. Dòng cuối là
 * "phiên song song" kiểm tra AI & đạo văn: gõ số từ là thấy giá ngay
 * (components/ai-check-teaser.tsx).
 *
 * Chỉ nhận các khóa đã lọc `buyable` và còn chỗ (lib/open-courses.ts). Khi
 * danh sách rỗng thì phần phiên chính không render, phiên song song vẫn còn.
 */
export function Programme({
  open,
  source = "home-open-courses",
  today = todayInVietnam(),
}: {
  open: OpenCourse[];
  source?: CtaSource;
  today?: string;
}) {
  const rows = programmeOrder(open, today);
  const span = programmeSpan(open);

  return (
    <div className="mt-10">
      {rows.length > 0 && (
        <div id="khoa-hoc" className="scroll-mt-24">
          <div className="flex items-baseline justify-between gap-4 border-b-2 border-rule pb-2">
            <h2 className="text-base font-bold">
              Lịch khai giảng{span ? ` ${span}` : ""}
            </h2>
            <Link
              href="/khoa-hoc"
              className="shrink-0 text-sm font-semibold text-primary underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              Tất cả khóa học
            </Link>
          </div>
          <ol>
            {rows.map(({ course, remaining }) => {
              const start = course.opening ? openingParts(course.opening.startDate) : null;
              const started = Boolean(course.opening && course.opening.startDate < today);
              const time = sessionTime(course);
              // "05 buổi — 05 module, buổi cuối …" → "05 buổi": dòng meta chỉ cần số buổi.
              const duration = factValue(course, "Thời lượng")?.split(" — ")[0];
              return (
                <li
                  key={course.slug}
                  className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 border-b border-line py-4 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-x-6 lg:grid-cols-[5.5rem_minmax(0,1fr)_18rem] lg:items-center"
                >
                  <p className="font-cond leading-none">
                    {start ? (
                      <>
                        <span className="block text-[1.75rem] font-bold">{start.day}</span>
                        <span className="mt-1 block text-[0.8125rem] text-fg-subtle">
                          {started ? "Đã khai giảng" : start.weekday}
                        </span>
                      </>
                    ) : (
                      <span className="block text-base font-bold">Sắp mở</span>
                    )}
                  </p>
                  <div className="min-w-0">
                    <Link
                      href={`/khoa-hoc/${course.slug}`}
                      className="text-[1.0625rem] leading-snug font-semibold text-fg hover:text-primary hover:underline hover:underline-offset-4 sm:text-lg"
                    >
                      {course.title}
                    </Link>
                    <p className="mt-1 text-sm text-fg-muted">
                      {[duration, time].filter(Boolean).join(" · ")}
                      {(duration || time) && <span aria-hidden> · </span>}
                      <span className="font-semibold text-fg">
                        {formatCount(enrolledCount[course.slug])}
                      </span>{" "}
                      {enrolledLabel}
                      <span aria-hidden> · </span>
                      <span
                        className={`font-semibold ${remaining <= FEW_SEATS ? "text-accent-text" : "text-fg"}`}
                      >
                        Còn {remaining} chỗ
                      </span>
                    </p>
                  </div>
                  <div className="col-start-2 flex items-center justify-between gap-x-4 lg:col-start-3">
                    <div className="min-w-0">
                      <PriceTag price={course.price} size="sm" />
                    </div>
                    <EnrollButton slug={course.slug} title={course.title} source={source} />
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <AiCheckTeaser />
    </div>
  );
}
