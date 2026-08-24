import Link from "next/link";
import { toDayInputVN } from "@/lib/format";

const inputClass =
  "rounded-full border border-line bg-card px-4 py-2 text-sm text-fg outline-none transition focus:border-primary";

const pillClass =
  "rounded-full border border-line bg-card px-4 py-2 text-sm font-bold text-fg-muted transition hover:border-primary hover:text-primary";

const activePillClass =
  "rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-fg";

/** Mốc `YYYY-MM-DD` của N ngày trước, theo giờ Việt Nam. */
function daysAgo(days: number, now: Date) {
  return toDayInputVN(new Date(now.getTime() - days * 24 * 60 * 60 * 1000));
}

/**
 * Lọc mọi danh sách trên trang quản trị theo một khoảng ngày chung.
 *
 * `<form method="get">` thuần, không JavaScript: khoảng ngày nằm trên URL nên
 * tải lại, bookmark hay gửi cho người khác đều giữ nguyên, và trang vẫn là
 * server component.
 *
 * KHÔNG lọc phía client như components/course-list.tsx làm. Các danh sách ở đây
 * đã bị `take` cắt (25–100 dòng) TRƯỚC khi rời server, nên lọc trên phần đã tải
 * sẽ chỉ lọc trong lát cắt đó — một bộ lọc trả về "không có đơn nào trong tháng
 * 5" trong khi tháng 5 có đơn là sai theo kiểu tệ nhất: trông vẫn hoạt động.
 * Mượn hình thức của course-list, không mượn cơ chế.
 */
export function DateFilter({
  from,
  to,
  now,
}: {
  from: string;
  to: string;
  now: Date;
}) {
  const presets = [
    { label: "7 ngày", from: daysAgo(7, now), to: "" },
    { label: "30 ngày", from: daysAgo(30, now), to: "" },
    { label: "90 ngày", from: daysAgo(90, now), to: "" },
  ];
  const active = (preset: { from: string; to: string }) =>
    from === preset.from && to === preset.to;
  const filtering = Boolean(from || to);

  return (
    <div className="mb-8 rounded-card border border-line bg-card p-4 sm:p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
        Lọc theo ngày
      </p>

      <form method="get" className="mt-3 flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-fg-muted">
          Từ ngày
          <input
            type="date"
            name="tu"
            defaultValue={from}
            max={to || undefined}
            className={`mt-1.5 block ${inputClass}`}
          />
        </label>
        <label className="text-xs font-semibold text-fg-muted">
          Đến ngày
          <input
            type="date"
            name="den"
            defaultValue={to}
            min={from || undefined}
            className={`mt-1.5 block ${inputClass}`}
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-fg transition hover:opacity-90"
        >
          Áp dụng
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        {presets.map((preset) => (
          <Link
            key={preset.label}
            href={`/quan-tri?tu=${preset.from}`}
            className={active(preset) ? activePillClass : pillClass}
          >
            {preset.label}
          </Link>
        ))}
        <Link
          href="/quan-tri"
          className={filtering ? pillClass : activePillClass}
        >
          Tất cả
        </Link>
        {filtering && (
          <p className="ml-auto text-xs text-fg-subtle">
            Đang lọc {from ? `từ ${from}` : "từ đầu"} {to ? `đến ${to}` : "đến nay"} — giờ
            Việt Nam.
          </p>
        )}
      </div>
    </div>
  );
}
