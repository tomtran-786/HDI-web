import type { ReactNode } from "react";
import type { CourseCover as CourseCoverData } from "@/content/course";
import { cartPage } from "@/content/checkout";
import { formatVnd } from "@/lib/format";
import { CourseCover } from "../course-cover";

export type LineCourse = {
  slug: string;
  code: string;
  title: string;
  cover: CourseCoverData;
  schedule?: string | null;
  format?: string | null;
};

/**
 * Một dòng hàng ở giỏ hàng và các trang đơn hàng: ảnh nhỏ 96×112 bên trái, tên
 * khóa đậm kèm các dòng meta 12px, giá canh phải ở trên, và ở góc dưới phải là
 * nút "Xóa" (`onRemove`, chỉ giỏ hàng có) hoặc một badge trạng thái (`status`)
 * thay cho giá khi khóa không mua được.
 *
 * Giá có ưu đãi: giá thật là số to nhất, giá gốc nhỏ hơn, gạch ngang và đứng
 * NGAY TRƯỚC nó; điều kiện ưu đãi (`dealNote`) đứng liền ngay dưới con số lớn.
 * Dùng chung cho cả giỏ hàng (client) lẫn trang đơn (server), nên không dùng hook.
 */
export function LineItem({
  id,
  course,
  unitVnd,
  listVnd,
  learners,
  dealNote,
  status,
  onRemove,
  children,
}: {
  id?: string;
  course: LineCourse;
  /** Giá một ghế thực trả. Vắng mặt khi `status` thay chỗ cho giá. */
  unitVnd?: number;
  /** Giá niêm yết một ghế, để gạch ngang khi `unitVnd` thấp hơn. */
  listVnd?: number;
  /** Số người học, in thành một dòng meta khi lớn hơn 1. */
  learners?: number;
  dealNote?: ReactNode;
  status?: ReactNode;
  onRemove?: () => void;
  children?: ReactNode;
}) {
  const hasDeal =
    unitVnd !== undefined && listVnd !== undefined && unitVnd < listVnd;

  return (
    <li id={id} className="flex gap-4 py-5 first:pt-0 sm:gap-5">
      <div className="h-28 w-24 shrink-0 overflow-hidden rounded-md bg-bg-soft">
        <CourseCover cover={course.cover} variant="thumb" sizes="96px" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold leading-snug text-fg">
              {course.title}
            </h3>
            <dl className="mt-1.5 space-y-0.5 text-xs leading-relaxed text-fg-muted">
              <Meta label={cartPage.line.code} value={course.code} />
              {course.schedule && (
                <Meta label={cartPage.line.schedule} value={course.schedule} />
              )}
              {course.format && (
                <Meta label={cartPage.line.format} value={course.format} />
              )}
              {learners !== undefined && learners > 1 && (
                <Meta label={cartPage.line.learners} value={String(learners)} />
              )}
            </dl>
          </div>

          {unitVnd !== undefined && (
            <div className="shrink-0 text-right">
              <p className="flex flex-wrap items-baseline justify-end gap-x-2">
                {hasDeal && (
                  <s className="text-xs font-semibold text-fg-subtle">
                    <span className="sr-only">Giá lẻ </span>
                    {formatVnd(listVnd)}
                  </s>
                )}
                <span className="text-lg font-bold tabular-nums text-primary">
                  {formatVnd(unitVnd)}
                </span>
              </p>
            </div>
          )}
        </div>

        {children}

        {(dealNote || status || onRemove) && (
          <div className="mt-auto flex items-end justify-between gap-3 pt-3">
            {/* Điều kiện ưu đãi nằm ngay dưới con số lớn nhưng ở hàng riêng, để
                câu dài không đẩy tên khóa hẹp lại ở màn hình nhỏ. */}
            <p className="min-w-0 text-xs font-semibold leading-snug text-success">
              {dealNote}
            </p>
            <span className="ml-auto flex shrink-0 items-center gap-3">
              {status}
              {onRemove && (
                <button
                  type="button"
                  onClick={onRemove}
                  aria-label={cartPage.removeLabel(course.title)}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-fg transition-colors hover:bg-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                >
                  {cartPage.remove}
                </button>
              )}
            </span>
          </div>
        )}
      </div>
    </li>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="inline">{label}: </dt>
      <dd className="inline text-fg">{value}</dd>
    </div>
  );
}
