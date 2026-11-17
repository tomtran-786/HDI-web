import type { Metadata } from "next";
import { aiCheck, aiCheckKinds, aiCheckTiers } from "@/content/ai-check";
import { site } from "@/content/site";
import { formatVnd } from "@/lib/format";
import { isAiCheckKind, isValidWordCount } from "@/lib/ai-check-pricing";
import { IconCheck } from "@/components/ui/icons";
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
 * Trang chủ được giữ ngắn có chủ đích; một bảng giá ba bậc chín ô cộng với một
 * form nhập liệu là đúng loại nội dung phải nằm ở trang con, có mục riêng trên
 * thanh điều hướng dẫn thẳng vào.
 */
export default async function AiCheckPage({
  searchParams,
}: PageProps<"/kiem-tra-ai-dao-van">) {
  const query = await searchParams;
  const parsedWords = typeof query.soTu === "string" ? Number(query.soTu) : NaN;
  const defaultWords = isValidWordCount(parsedWords) ? parsedWords : undefined;
  const defaultKind = isAiCheckKind(query.dichVu) ? query.dichVu : undefined;

  return (
    <>
      <section className="border-b border-line bg-bg">
        <div className="shell py-14 sm:py-16 lg:py-20">
          <h1 className="max-w-[22ch] text-[2.25rem] leading-[1.08] font-extrabold tracking-[-0.03em] sm:text-5xl lg:text-[3.25rem]">
            {aiCheck.title}
          </h1>
          <p className="mt-4 max-w-[54ch] text-lg leading-relaxed text-fg-muted">
            {aiCheck.subtitle}
          </p>
          <p className="mt-3 max-w-[54ch] leading-relaxed text-fg-muted">{aiCheck.intro}</p>

          {/* Bốn bước của một đơn, dạng bảng chương trình: số thứ tự ở đây
              mang thông tin (đúng thứ tự phải làm), nên được giữ. */}
          <h2 className="mt-10 border-b-2 border-rule pb-2 text-base font-bold">
            {aiCheck.stepsTitle}
          </h2>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4">
            {aiCheck.steps.map((step, index) => (
              <li
                key={step.title}
                className="border-b border-line py-4 sm:pr-6 lg:border-b-0 lg:border-r lg:px-5 lg:first:pl-0 lg:last:border-r-0"
              >
                <p className="font-cond text-[1.75rem] leading-none font-bold text-primary">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-2 font-semibold">{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-fg-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-bg text-fg">
        <div className="shell grid gap-12 py-14 sm:py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16 lg:py-20">
          <div>
            <h2 className="text-xl font-bold">{aiCheck.tableTitle}</h2>
            {/* Một bảng thật: ba bậc độ dài theo hàng, ba loại kiểm tra theo
                cột — đọc được cả theo hàng lẫn theo cột, không còn ba thẻ. */}
            <table className="mt-4 w-full border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-rule align-bottom">
                  <th scope="col" className="py-2 pr-3 text-[0.8125rem] font-semibold text-fg-muted">
                    Độ dài bản thảo
                  </th>
                  {aiCheckKinds.map((kind) => (
                    <th
                      key={kind.id}
                      scope="col"
                      className="py-2 pl-3 text-right text-[0.8125rem] font-semibold text-fg-muted"
                    >
                      {kind.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {aiCheckTiers.map((tier) => (
                  <tr key={tier.id} className="border-b border-line">
                    <th scope="row" className="py-4 pr-3 align-top font-normal">
                      <span className="block font-semibold">{tier.label}</span>
                      <span className="block text-sm text-fg-subtle">{tier.words}</span>
                    </th>
                    {aiCheckKinds.map((kind) => (
                      <td
                        key={kind.id}
                        className="py-4 pl-3 text-right align-top font-cond text-lg font-bold whitespace-nowrap"
                      >
                        {formatVnd(tier.prices[kind.id])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            {/* Ba cam kết đặt ngay trên form — nơi người đọc quyết định gửi bài. */}
            <ul className="mb-4 grid gap-3 sm:grid-cols-3">
              {aiCheck.promises.map((promise) => (
                <li key={promise.title} className="flex gap-2.5">
                  <IconCheck size={18} className="mt-0.5 shrink-0 text-success" />
                  <span className="leading-tight">
                    <span className="block text-sm font-semibold">{promise.title}</span>
                    <span className="block text-[0.8125rem] text-fg-muted">{promise.body}</span>
                  </span>
                </li>
              ))}
            </ul>
            <QuoteForm defaultWords={defaultWords} defaultKind={defaultKind} />
          </div>
        </div>
      </section>
    </>
  );
}
