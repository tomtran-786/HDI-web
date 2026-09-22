"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { IconStar } from "@/components/ui/icons";
import { COMMENT_MAX, RATING_VALUES } from "@/lib/review-input";
import { review } from "@/content/review";
import { saveReview, type ReviewState } from "./actions";

/**
 * Đánh giá một khóa đã mua — một nút trên thẻ khóa, bấm mới mở modal.
 *
 * Trước đây form hiện thẳng trong thẻ; giờ gọn lại thành nút + `<dialog>` theo
 * đúng khuôn ở app/tai-khoan/don-hang/[code]/cancel.tsx (bẫy focus, Esc để
 * đóng, khôi phục focus — miễn phí từ dialog gốc).
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = `review-dialog-${courseId}`;
  /**
   * Số lần đã mở hộp thoại, dùng làm `key` cho phần thân.
   *
   * `useActionState` giữ `state.saved` tới hết vòng đời component, và đây là
   * client component nên `revalidatePath("/tai-khoan")` không dọn nó: mở lại
   * lần thứ hai chỉ thấy đúng màn "Đã gửi", muốn sửa phải tải lại cả trang.
   * Hook đó không có đường reset, nên nó phải nằm trong một component con bị
   * dựng lại theo `key` — đó là lý do `ReviewDialogBody` tồn tại.
   */
  const [opened, setOpened] = useState(0);
  /** Đã gửi ít nhất một lần trong phiên này, để nhãn ngoài thẻ nói đúng. */
  const [justSaved, setJustSaved] = useState(false);
  // `useCallback`: prop này nằm trong mảng phụ thuộc của một effect bên trong
  // `ReviewDialogBody`, nên một hàm mới mỗi lượt render là một lượt chạy effect
  // thừa mỗi lượt render.
  const markSaved = useCallback(() => setJustSaved(true), []);

  // Sau khi gửi thành công, trạng thái luôn quay về chờ duyệt — kể cả khi lần
  // trước đã được đăng — nên nhãn phải nói đúng điều đó thay vì đọc lại
  // `status` cũ do server render ra.
  const shown = justSaved ? "pending" : status;

  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-5">
      <button
        type="button"
        onClick={() => {
          // CHỈ dựng lại thân hộp thoại khi lần trước đã gửi xong — đó là lúc
          // duy nhất cần dọn `state.saved`. Dựng lại vô điều kiện sẽ reset cả
          // ô nhận xét, tức nuốt mất bản nháp của người bấm "Hủy" rồi mở lại.
          if (justSaved) setOpened((n) => n + 1);
          dialogRef.current?.showModal();
        }}
        className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
      >
        {status ? review.editCta : review.rateCta}
      </button>
      {shown && (
        <span className="text-xs text-fg-subtle">{review.statusHint[shown]}</span>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current.close();
        }}
        className="w-[calc(100vw-2rem)] max-w-md"
      >
        <ReviewDialogBody
          key={opened}
          courseId={courseId}
          titleId={titleId}
          defaultRating={defaultRating}
          defaultComment={defaultComment}
          status={status}
          shown={shown}
          onSaved={markSaved}
          onClose={() => dialogRef.current?.close()}
        />
      </dialog>
    </div>
  );
}

/**
 * Thân hộp thoại, tách riêng CHỈ để `useActionState` nằm trong một component
 * dựng lại được theo `key`. Xem chú thích `opened` ở trên.
 */
function ReviewDialogBody({
  courseId,
  titleId,
  defaultRating,
  defaultComment,
  status,
  shown,
  onSaved,
  onClose,
}: {
  courseId: string;
  titleId: string;
  defaultRating?: number;
  defaultComment?: string | null;
  status?: "pending" | "published" | "rejected";
  shown?: "pending" | "published" | "rejected";
  onSaved: () => void;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(
    saveReview,
    {},
  );
  const [rating, setRating] = useState(defaultRating ?? 0);

  // Báo lên cha, để nhãn ngoài thẻ giữ nguyên "chờ duyệt" sau khi thân này bị
  // dựng lại ở lần mở sau.
  useEffect(() => {
    if (state.saved) onSaved();
  }, [state.saved, onSaved]);

  return (
    <form action={action} className="px-5 py-5 sm:px-6">
      <input type="hidden" name="courseId" value={courseId} />

      <h3
        id={titleId}
        className="text-lg font-bold tracking-tight text-primary"
      >
        {review.dialogTitle}
      </h3>

      {state.error && (
        <p
          role="alert"
          className="mt-3 rounded-card border border-line bg-bg-soft px-4 py-3 text-sm text-fg-muted"
        >
          {state.error}
        </p>
      )}

      {state.saved ? (
        <>
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">
            {review.saved}
          </p>
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full border border-line px-6 py-2.5 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
            >
              {review.close}
            </button>
          </div>
        </>
      ) : (
        <>
          {shown && !state.error && (
            <p className="mt-2 text-sm text-fg-muted">
              {review.statusHint[shown]}.
            </p>
          )}

          <fieldset className="mt-3">
            <legend className="sr-only">{review.ratingLegend}</legend>
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
                    size={22}
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
            {review.commentLabel}
          </label>
          <textarea
            id={`comment-${courseId}`}
            name="comment"
            rows={3}
            maxLength={COMMENT_MAX}
            defaultValue={defaultComment ?? ""}
            placeholder={review.commentPlaceholder}
            className="mt-3 w-full rounded-card border border-line bg-bg px-4 py-3 text-[15px] text-fg outline-none transition placeholder:text-fg-subtle focus:border-primary"
          />

          <p className="mt-2 text-xs leading-relaxed text-fg-subtle">
            {review.publicNotice}
          </p>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full border border-line px-6 py-2.5 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
            >
              {review.cancel}
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-fg transition hover:bg-primary-deep disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending
                ? review.submitting
                : status
                  ? review.update
                  : review.submit}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
