"use client";

import { useState } from "react";
import { aiCheck } from "@/content/ai-check";

/**
 * Mã đơn kèm nút sao chép.
 *
 * Tồn tại vì Zalo không nhận sẵn nội dung tin nhắn qua deep link: học viên phải
 * tự mang mã sang cửa sổ chat. Thứ duy nhất giảm được ma sát đó là để mã nằm
 * thật to và sao chép được bằng một lần bấm.
 */
export function CopyCode({ code }: { code: number }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <p className="text-3xl font-bold tabular-nums tracking-tight text-primary">
        #{code}
      </p>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(String(code));
            setCopied(true);
            // Nhãn tự quay lại sau vài giây: một nút đứng mãi ở "Đã sao chép"
            // trông như đã hỏng khi người dùng muốn bấm lần thứ hai.
            setTimeout(() => setCopied(false), 2500);
          } catch {
            // Trình duyệt từ chối clipboard (thường vì không phải HTTPS). Mã vẫn
            // hiện ngay bên cạnh nên vẫn chép tay được; không báo lỗi làm gì.
          }
        }}
        className="inline-flex items-center gap-2 rounded-xs border border-rule px-4 py-2 text-sm font-semibold text-fg-muted transition hover:bg-fg hover:text-bg"
      >
        {copied ? aiCheck.result.copied : aiCheck.result.copy}
      </button>
    </div>
  );
}
