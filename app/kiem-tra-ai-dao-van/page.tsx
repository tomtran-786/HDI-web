import type { Metadata } from "next";
import Link from "next/link";
import { aiCheck, aiCheckKinds, aiCheckTiers } from "@/content/ai-check";
import { site } from "@/content/site";
import { formatVnd } from "@/lib/format";
import { QuoteForm } from "./quote-form";

export const metadata: Metadata = {
  title: `Kiểm tra AI & đạo văn — ${site.name}`,
  description:
    "Bảng giá dịch vụ kiểm tra tỷ lệ AI và tỷ lệ trùng lặp cho tiểu luận, khóa luận và bản thảo bài báo. Nhập số từ để biết chi phí và thanh toán trực tuyến.",
  alternates: { canonical: "/kiem-tra-ai-dao-van" },
};

/**
 * Dịch vụ check AI/đạo văn có trang riêng thay vì một thẻ trên trang chủ.
 *
 * Trang chủ được giữ ngắn có chủ đích; một bảng giá hai bậc sáu ô cộng với một
 * form nhập liệu là đúng loại nội dung phải nằm ở trang con và được dẫn tới từ
 * khối liên quan (#dich-vu).
 */
export default function AiCheckPage() {
  return (
    <>
      <section className="border-b border-line bg-bg">
        <div className="shell py-14 sm:py-16 lg:py-20">
          <Link
            href="/#dich-vu"
            className="inline-flex items-center gap-2 text-sm font-semibold text-fg-muted transition hover:text-primary"
          >
            {/* IconArrow chỉ lên-phải; link quay lại cần đúng một mũi tên trái,
                theo cùng quy ước glyph mà /cong-bo đang dùng. */}
            <span aria-hidden>←</span>
            Về trang chủ
          </Link>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
            {aiCheck.eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-primary sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            {aiCheck.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-fg-muted sm:text-lg">
            {aiCheck.subtitle}
          </p>
        </div>
      </section>

      <section className="border-t border-line bg-bg-soft text-fg">
        <div className="shell py-16 sm:py-20 lg:py-24">
          <p className="max-w-2xl text-base leading-relaxed text-fg-muted sm:text-[17px]">
            {aiCheck.intro}
          </p>

          <div className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-fg">
                {aiCheck.tableTitle}
              </h2>
              <div className="mt-4 space-y-4">
                {aiCheckTiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="rounded-card border border-line bg-card p-5 sm:p-6"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                      {tier.words}
                    </p>
                    <h3 className="mt-1.5 text-base font-bold tracking-tight text-fg">
                      {tier.label}
                    </h3>
                    <dl className="mt-4">
                      {aiCheckKinds.map((kind) => (
                        <div
                          key={kind.id}
                          className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-2.5 last:border-0"
                        >
                          <dt className="text-[13px] text-fg-muted">
                            {kind.label}
                          </dt>
                          <dd className="text-[15px] font-bold tabular-nums text-primary">
                            {formatVnd(tier.prices[kind.id])}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </div>

            <QuoteForm />
          </div>
        </div>
      </section>
    </>
  );
}
