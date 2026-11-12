"use client";

import { useState } from "react";
import { referralPage } from "@/content/referral";

/**
 * Một giá trị cần mang đi nơi khác, kèm nút sao chép.
 *
 * Giá trị LUÔN hiện nguyên văn bên cạnh nút, không nằm sau nó: clipboard bị từ
 * chối ở mọi ngữ cảnh không phải HTTPS, và một nút sao chép im lặng không làm gì
 * là cách để học viên tưởng mình đã có mã trong tay khi thật ra chưa.
 */
export function CopyField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div>
      <p className="text-[0.8125rem] font-bold uppercase tracking-[0.06em] text-fg-subtle">
        {label}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-3">
        <p
          className={`break-all font-bold text-primary ${
            mono ? "text-2xl tracking-[0.12em]" : "text-sm"
          }`}
        >
          {value}
        </p>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              // Nhãn tự quay lại: một nút đứng mãi ở "Đã sao chép" trông như đã
              // hỏng khi người dùng muốn bấm lần thứ hai.
              setTimeout(() => setCopied(false), 2500);
            } catch {
              // Trình duyệt từ chối clipboard. Giá trị vẫn nằm ngay bên cạnh.
            }
          }}
          className="inline-flex items-center gap-2 rounded-button border border-rule px-4 py-2 text-xs font-semibold text-fg-muted transition hover:bg-fg hover:text-bg"
        >
          {copied ? referralPage.copied : referralPage.copy}
        </button>
      </div>
    </div>
  );
}
