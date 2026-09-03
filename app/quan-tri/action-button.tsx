"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

export type AdminActionResult = { ok: boolean; message: string };

/**
 * Một nút quản trị có nói cho người bấm biết chuyện gì đã xảy ra.
 *
 * Lý do tồn tại: nút "Hủy đơn" trước đây bọc action trong một closure
 * `await cancelPendingOrder(id)` rồi VỨT giá trị trả về. Action vẫn trả
 * `{ ok, message }` — kể cả "PayOS chưa cho phép hủy đơn này." — nhưng chuỗi đó
 * không có đường nào ra màn hình. Quản trị viên bấm, trang revalidate, dòng đó y
 * nguyên, không một chữ nào hiện lên: không phân biệt được với một cái nút chết.
 *
 * Cả ba action quản trị giờ cùng trả `{ ok, message }`, nên chỗ này là một
 * component dùng chung thay vì ba bản gần giống nhau.
 */
export function AdminActionButton({
  action,
  id,
  label,
  confirm,
  className = "rounded-full border border-line px-4 py-2 text-sm font-bold text-fg-muted transition hover:border-primary hover:text-primary",
}: {
  /**
   * Server action trả về kết quả có lời nhắn. Thường nhận một id (mã đơn, mã
   * giao dịch…); action không cần id thì bỏ tham số — `id` bên dưới vẫn được
   * truyền vào nhưng bị bỏ qua.
   */
  action: (id?: unknown) => Promise<AdminActionResult>;
  id: string;
  label: string;
  /** Câu hỏi xác nhận, cho các thao tác không lùi lại được. */
  confirm?: string;
  className?: string;
}) {
  const [state, formAction] = useActionState<AdminActionResult | null, FormData>(
    async () => action(id),
    null,
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
      className="flex flex-col items-end gap-1"
    >
      <SubmitButton className={className}>{label}</SubmitButton>
      {state && (
        <p
          // role="status" để trình đọc màn hình đọc lên kết quả — nút này thay
          // đổi dữ liệu, và phản hồi duy nhất là dòng chữ này.
          role="status"
          className={`text-right text-xs leading-snug ${
            state.ok ? "text-fg-muted" : "text-danger"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

/** Tách riêng vì `useFormStatus` chỉ đọc được form của component CHA nó. */
function SubmitButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:opacity-50`}>
      {pending ? "Đang xử lý…" : children}
    </button>
  );
}
