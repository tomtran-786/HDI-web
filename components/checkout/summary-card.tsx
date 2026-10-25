import type { ReactNode } from "react";

export type SummaryLine = {
  key: string;
  label: ReactNode;
  /** Vắng mặt = chỉ in nhãn (vd. dòng credits chưa có khoản trừ). */
  value?: string;
  /** `discount` tô xanh cho các khoản được trừ. */
  tone?: "default" | "discount";
  /** Câu giải thích ngắn dưới dòng (vd. vì sao khoản giảm bị trần). */
  note?: string;
};

/**
 * Thẻ "Tóm tắt đơn hàng" bên phải giỏ hàng và các trang thanh toán: tiêu đề,
 * đường kẻ, một ô nội dung tùy ý (`children`: ô mã giới thiệu, trạng thái đơn),
 * các dòng tiền canh hai bên, dòng tổng in đậm, rồi ô hành động (`actions`: nút
 * thanh toán, hủy đơn…). Phẳng, phân tách bằng đường kẻ mảnh; dính trên desktop.
 *
 * Giá gốc gạch ngang của dòng tổng (`total.was`) đứng ngay cạnh con số thật và
 * nhỏ hơn nó — quy ước hiển thị giá có ưu đãi của cả site.
 */
export function SummaryCard({
  title,
  children,
  lines = [],
  total,
  actions,
  sticky = true,
}: {
  title: string;
  children?: ReactNode;
  lines?: SummaryLine[];
  total?: { label: string; value: string; was?: string; note?: string };
  actions?: ReactNode;
  sticky?: boolean;
}) {
  return (
    <aside
      className={`self-start rounded-card border border-line bg-card p-5 ${
        sticky ? "lg:sticky lg:top-24" : ""
      }`}
    >
      <h2 className="text-base font-bold text-fg">{title}</h2>
      <div className="mt-3 border-t border-line" />

      {children && <div className="pt-4">{children}</div>}

      {(lines.length > 0 || total) && (
        <dl className={`space-y-2 text-sm ${children ? "mt-4 border-t border-line pt-4" : "pt-4"}`}>
          {lines.map((line) => (
            <div key={line.key}>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="min-w-0 text-fg-muted">{line.label}</dt>
                {line.value !== undefined && (
                  <dd
                    className={`shrink-0 tabular-nums ${
                      line.tone === "discount" ? "font-semibold text-success" : "text-fg"
                    }`}
                  >
                    {line.value}
                  </dd>
                )}
              </div>
              {line.note && (
                <p className="mt-1 text-xs leading-relaxed text-fg-subtle">{line.note}</p>
              )}
            </div>
          ))}
          {total && (
            <div
              className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 ${
                lines.length > 0 ? "border-t border-line pt-3" : ""
              }`}
            >
              <dt className="font-bold text-fg">
                {total.label}
                {total.note && (
                  <span className="ml-1.5 text-xs font-medium text-fg-muted">
                    {total.note}
                  </span>
                )}
              </dt>
              <dd className="flex flex-wrap items-baseline justify-end gap-x-2">
                <span className="text-xl font-bold tabular-nums tracking-tight text-primary">
                  {total.value}
                </span>
                {total.was && (
                  <s className="text-xs font-semibold text-fg-subtle">
                    <span className="sr-only">Giá lẻ </span>
                    {total.was}
                  </s>
                )}
              </dd>
            </div>
          )}
        </dl>
      )}

      {actions && <div className="mt-4">{actions}</div>}
    </aside>
  );
}
