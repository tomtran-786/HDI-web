import Link from "next/link";
import { aiCheckFromPrices, aiCheckUpsell } from "@/content/ai-check";
import { formatVnd } from "@/lib/format";
import { buttonClass } from "./ui/button";

/**
 * Dòng gợi ý dịch vụ kiểm tra AI & đạo văn, đặt sau phần chính của trang thanh
 * toán thành công và trang tài khoản. Mảng `tint` phẳng như dòng "Song song" ở
 * trang chủ, một nút phụ — không tranh với nút chính của trang.
 */
export function AiCheckUpsell({ className = "" }: { className?: string }) {
  const fromPrice = formatVnd(
    Math.min(...Object.values(aiCheckFromPrices)),
  );
  return (
    <aside
      className={`flex flex-col gap-4 bg-tint px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${className}`}
    >
      <div className="min-w-0">
        <p className="font-bold text-fg">{aiCheckUpsell.title}</p>
        <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-fg-muted">
          {aiCheckUpsell.body(fromPrice)}
        </p>
      </div>
      <Link
        href="/kiem-tra-ai-dao-van"
        className={buttonClass({ variant: "secondary", className: "shrink-0" })}
      >
        {aiCheckUpsell.cta}
      </Link>
    </aside>
  );
}
