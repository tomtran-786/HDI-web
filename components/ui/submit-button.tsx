"use client";

import { useFormStatus } from "react-dom";

/**
 * Nút submit tự báo "đang xử lý", tách riêng khỏi form vì `useFormStatus` chỉ
 * đọc được `<form>` của component CHA nó — cùng lý do `SubmitButton` trong
 * `app/quan-tri/action-button.tsx` phải là một component con.
 *
 * Tồn tại vì một lý do cụ thể: `lib/prisma.ts` đã tự ghi lại rằng một kết nối
 * MỚI tới pooler Supabase có thể mất tới nửa giây khi thành công, và hỏng
 * khoảng một nửa số lần thử — kịch bản bình thường khi lambda vừa được đánh
 * thức sau một lúc không có traffic. Khu vực đăng nhập/đăng ký/xác thực trước
 * đây không có nút nào báo trạng thái này, nên vài giây chờ đó không phân biệt
 * được với một trang bị treo. Nút này không làm request nhanh hơn — nó chỉ nói
 * cho người bấm biết là nó đang chạy.
 */
export function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
