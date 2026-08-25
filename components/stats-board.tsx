"use client";

import { useEffect, useRef } from "react";
import { observeReveal } from "@/lib/reveal-observer";
import { stats, type Stat } from "@/content/stats";

/** 37300 → "37,300". Không dùng toLocaleString: máy chủ và trình duyệt có thể
 *  chọn locale khác nhau, và một chuỗi lệch nhau ở lần render đầu là lỗi
 *  hydrate. Hàm này cho cùng một kết quả ở cả hai phía. */
function group(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function format(stat: Stat, value: number): string {
  const digits = stat.grouped ? group(value) : String(value);
  return `${stat.prefix ?? ""}${digits}${stat.suffix ?? ""}`;
}

const DURATION_MS = 1400;

/** Chạy số từ 0 tới `stat.to` khi ô cuộn vào tầm nhìn, đúng một lần.
 *
 *  Từng khung hình được ghi thẳng vào `textContent` thay vì đi qua state: một
 *  lần chạy là khoảng tám mươi khung hình, và tám mươi lần render lại cho một
 *  hiệu ứng trang trí là cái giá không đáng trả. Giá trị cuối vẫn nằm trong
 *  JSX nên HTML từ máy chủ, lần render đầu ở trình duyệt và mọi lần render sau
 *  đều hiện đúng con số thật — kể cả khi người dùng tắt JavaScript. */
function RunningScore({ stat }: { stat: Stat }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let start = 0;
    const step = (now: number) => {
      start ||= now;
      const progress = Math.min((now - start) / DURATION_MS, 1);
      // easeOutCubic: nhanh lúc đầu rồi chậm dần về đích, giống đồng hồ đếm.
      const eased = 1 - (1 - progress) ** 3;
      element.textContent = format(stat, Math.round(stat.to * eased));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    // Số chỉ được đưa về 0 ngay trước khi chạy, chứ không phải lúc effect chạy:
    // nếu vì lý do nào đó observer không bao giờ báo, con số thật vẫn nằm nguyên
    // trên màn hình thay vì kẹt ở 0.
    const unobserve = observeReveal(element, () => {
      element.textContent = format(stat, 0);
      frame = requestAnimationFrame(step);
    });

    return () => {
      unobserve();
      cancelAnimationFrame(frame);
      element.textContent = format(stat, stat.to);
    };
  }, [stat]);

  return (
    <span
      ref={ref}
      // Con số đang nhảy là hiệu ứng trang trí; trình đọc màn hình lấy giá trị
      // thật từ nhãn ẩn bên cạnh thay vì đọc lại từng khung hình.
      aria-hidden
      className="block text-3xl font-bold tracking-tight text-primary tabular-nums sm:text-4xl"
    >
      {format(stat, stat.to)}
    </span>
  );
}

/**
 * Bốn con số tóm tắt hồ sơ học thuật. Không bọc trong `<Section>`: nó nằm bên
 * trong khối mở đầu của trang /cong-bo, ngay trên bốn mục mà nó tóm tắt.
 */
export function StatsBoard() {
  return (
    <dl className="grid grid-cols-2 divide-x divide-line rounded-card border border-line bg-card lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="border-b border-line px-6 py-8 text-center last:border-b-0 sm:border-b-0 [&:nth-child(-n+2)]:border-b lg:[&:nth-child(-n+2)]:border-b-0"
        >
          <dt className="sr-only">{`${stat.label}: ${format(stat, stat.to)}`}</dt>
          <dd>
            <RunningScore stat={stat} />
            <span className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-subtle">
              {stat.label}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
