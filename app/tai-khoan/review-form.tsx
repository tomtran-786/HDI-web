"use client";

import { useState } from "react";
import { useActionState } from "react";
import { IconStar } from "@/components/ui/icons";
import { COMMENT_MAX, RATING_VALUES } from "@/lib/review-input";
import { saveReview, type ReviewState } from "./actions";

/**
 * Form đánh giá một khóa đã mua.
 *
 * Import từ lib/review-input chứ không phải lib/reviews: file kia đụng Prisma
 * và đây là client component.
 *
 * Các `<input type="radio">` thật vẫn còn, chỉ bị `sr-only` che đi. Vẽ sao bằng
 * button rồi giữ điểm trong state là cách làm hỏng bàn phím và hỏng trình đọc
 * màn hình — nhóm radio thật cho sẵn mũi tên trái/phải, nhãn đọc được và cả
 * hành vi `required` của trình duyệt.
 */
export function ReviewForm({
  courseId,
  defaultRating,
  defaultComment,
  status,
}: {
  courseId: string;
  defaultRating?: number;
  defaultComment?: string | null;
  /** Trạng thái của đánh giá đã gửi trước đó, nếu có. */
  status?: "pending" | "published" | "rejected";
}) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(
    saveReview,
    {},
  );
  const [rating, setRating] = useState(defaultRating ?? 0);

  // Sau khi gửi thành công, trạng thái luôn quay về chờ duyệt — kể cả khi lần
  // trước đã được đăng — nên thông báo phải nói đúng điều đó thay vì đọc lại
  // `status` cũ do server render ra.
  const shown = state.saved ? "pending" : status;

  return (
    <form action={action} className="mt-6 border-t border-line pt-5">
      <input type="hidden" name="courseId" value={courseId} />

      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
        {status ? "Đánh giá của bạn" : "Đánh giá khóa học"}
      </p>

      {state.error && (
        <p
          role="alert"
          className="mt-3 rounded-card border border-line bg-bg-soft px-4 py-3 text-sm text-fg-muted"
        >
          {state.error}
        </p>
      )}

      {shown && !state.error && (
        <p className="mt-3 text-sm text-fg-muted">
          {shown === "pending" &&
            "Đã gửi. Đánh giá sẽ hiện trên trang khóa học sau khi được duyệt."}
          {shown === "published" && "Đánh giá của bạn đang hiện trên trang khóa học."}
          {shown === "rejected" &&
            "Đánh giá này chưa được đăng. Bạn có thể viết lại và gửi tiếp."}
        </p>
      )}

      <fieldset className="mt-3">
        <legend className="sr-only">Số sao</legend>
        <div className="flex items-center gap-1">
          {RATING_VALUES.map((value) => (
            <label
              key={value}
              className="cursor-pointer rounded-full p-0.5"
              title={`${value} sao`}
            >
              <input
                type="radio"
                name="rating"
                value={value}
                required
                checked={rating === value}
                onChange={() => setRating(value)}
                className="peer sr-only"
              />
              <IconStar
                size={26}
                filled={value <= rating}
                className={`rounded-full ring-offset-2 ring-offset-card transition peer-focus-visible:ring-2 peer-focus-visible:ring-primary ${
                  value <= rating ? "text-warning" : "text-line"
                }`}
              />
              <span className="sr-only">{value} sao</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label htmlFor={`comment-${courseId}`} className="sr-only">
        Nhận xét về khóa học
      </label>
      <textarea
        id={`comment-${courseId}`}
        name="comment"
        rows={3}
        maxLength={COMMENT_MAX}
        defaultValue={defaultComment ?? ""}
        placeholder="Khóa học giúp bạn được điều gì? (không bắt buộc)"
        className="mt-3 w-full rounded-card border border-line bg-bg px-4 py-3 text-[15px] text-fg outline-none transition placeholder:text-fg-subtle focus:border-primary"
      />

      <p className="mt-2 text-xs leading-relaxed text-fg-subtle">
        Đánh giá sẽ hiện công khai trên trang khóa học kèm tên tài khoản của bạn,
        sau khi được HDI duyệt.
      </p>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-bold text-fg transition hover:border-primary hover:text-primary disabled:opacity-60"
      >
        {pending ? "Đang gửi…" : status ? "Cập nhật đánh giá" : "Gửi đánh giá"}
      </button>
    </form>
  );
}
