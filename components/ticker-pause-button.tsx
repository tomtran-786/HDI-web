"use client";

import { useState } from "react";
import { IconPause, IconPlay } from "./ui/icons";

/**
 * Nút dừng dải lịch khai giảng.
 *
 * WCAG 2.2.2 "Pause, Stop, Hide" (mức A): nội dung tự chạy quá 5 giây, đặt song
 * song với nội dung khác, phải có cơ chế dừng mà NGƯỜI DÙNG điều khiển được.
 * Dừng khi rê chuột là không đủ — người dùng bàn phím không có con chuột.
 *
 * Trạng thái nằm ở `data-paused` trên dải chứ không ở React state của cả dải:
 * nhờ vậy toàn bộ nội dung dải vẫn là server component, chỉ mỗi cái nút này đi
 * qua ranh giới client — cùng lối với `OpenCourseEnrollButton`. `useState` ở đây
 * chỉ để đổi NHÃN, và cùng một handler ghi cả hai nên chúng không thể lệch nhau.
 *
 * Chưa hydrate thì nút hiện "Tạm dừng" và dải đang chạy — đúng trạng thái thật,
 * vì phần chuyển động là CSS thuần, không chờ JS.
 */
export function TickerPauseButton() {
  const [paused, setPaused] = useState(false);

  return (
    <button
      type="button"
      onClick={(event) => {
        const next = !paused;
        const band = event.currentTarget.closest("[data-ticker]");
        if (band instanceof HTMLElement) band.dataset.paused = String(next);
        setPaused(next);
      }}
      // Nhãn nhìn thấy được làm tiền tố (WCAG 2.5.3 Label in Name), và tên đổi
      // theo trạng thái nên không cần thêm aria-pressed.
      aria-label={`${paused ? "Chạy tiếp" : "Tạm dừng"} dải lịch khai giảng`}
      // `border-fg-subtle` chứ không `border-line` như phần còn lại của site:
      // hairline `--border` được chỉnh cho nền trắng và nền navy đậm, đặt lên
      // dải tint nó chỉ còn 1.07:1 và cái nút mất hẳn đường bao. `--fg-subtle`
      // đo được 3.75:1 (sáng) và 4.57:1 (tối) trên chính nền này.
      className="ticker-toggle inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full border border-fg-subtle px-2 text-[13px] font-bold text-fg-muted transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-tint sm:px-3"
    >
      {paused ? <IconPlay size={15} /> : <IconPause size={15} />}
      <span className="hidden sm:inline">{paused ? "Chạy tiếp" : "Tạm dừng"}</span>
    </button>
  );
}
