"use client";

import { useActionState, useState } from "react";
import {
  aiCheck,
  aiCheckKinds,
  aiCheckTiers,
  WORD_LIMIT,
  type AiCheckKind,
} from "@/content/ai-check";
import { composeEmailHref, links } from "@/content/site";
import { quote } from "@/lib/ai-check-pricing";
import { formatVnd } from "@/lib/format";
import { IconArrow, IconMessage } from "@/components/ui/icons";
import { startServiceCheckout, type QuoteState } from "./actions";

/**
 * Ô nhập số từ + chọn dịch vụ, hiện chi phí ngay khi gõ.
 *
 * Con số hiện ở đây và con số gửi sang PayOS đều do `quote()` sinh ra — cùng
 * một hàm, chạy hai nơi. Nếu client tự tính để hiển thị còn server tự tính lại
 * theo cách khác thì hai bên sẽ lệch nhau đúng vào lần đổi bảng giá, và cái
 * lệch đó là một hóa đơn sai chứ không phải một lỗi hiển thị.
 */
export function QuoteForm() {
  const [state, action, pending] = useActionState<QuoteState, FormData>(
    startServiceCheckout,
    {},
  );
  const [words, setWords] = useState("");
  const [kind, setKind] = useState<AiCheckKind>(aiCheckKinds[0].id);

  const typed = words.trim();
  const parsed = Number(typed);
  const wordCount =
    typed !== "" && Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  const priced = wordCount === null ? null : quote(wordCount, kind);
  const tooLong = priced !== null && !priced.ok && priced.reason === "too_long";
  const payable = priced?.ok === true;

  return (
    <form action={action} className="rounded-card border border-line bg-card p-6 sm:p-8">
      <h2 className="text-lg font-bold tracking-tight text-fg">
        {aiCheck.formTitle}
      </h2>

      {state.error && (
        <p
          role="alert"
          className="mt-5 rounded-card border border-line bg-bg-soft px-4 py-3 text-sm text-fg-muted"
        >
          {state.error}
        </p>
      )}

      <label
        htmlFor="wordCount"
        className="mt-6 block text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle"
      >
        {aiCheck.wordLabel}
      </label>
      <input
        id="wordCount"
        name="wordCount"
        type="number"
        inputMode="numeric"
        min={1}
        step={1}
        required
        value={words}
        onChange={(event) => setWords(event.target.value)}
        placeholder="8000"
        className="mt-2 w-full rounded-card border border-line bg-bg px-4 py-3 text-[15px] text-fg outline-none transition placeholder:text-fg-subtle focus:border-primary"
      />
      <p className="mt-2 text-xs leading-relaxed text-fg-subtle">
        {aiCheck.wordHint}
      </p>

      <fieldset className="mt-7">
        <legend className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
          {aiCheck.kindLabel}
        </legend>
        <div className="mt-3 space-y-2.5">
          {aiCheckKinds.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-card border border-line px-4 py-3 transition hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-tint"
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="kind"
                  value={option.id}
                  required
                  checked={kind === option.id}
                  onChange={() => setKind(option.id)}
                  className="h-4 w-4 shrink-0 accent-[var(--primary)]"
                />
                <span className="text-[15px] leading-snug text-fg">
                  {option.label}
                </span>
              </span>
              {/* Giá của TỪNG lựa chọn theo đúng bậc đang áp dụng, chứ không chỉ
                  giá của lựa chọn đang chọn: học viên so ba mức ngay tại chỗ mà
                  không phải bấm qua lại để dò. */}
              {wordCount !== null && !tooLong && (
                <span className="shrink-0 text-sm font-bold tabular-nums text-primary">
                  {(() => {
                    const each = quote(wordCount, option.id);
                    return each.ok ? formatVnd(each.amountVnd) : "—";
                  })()}
                </span>
              )}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-7 rounded-card border border-line bg-bg-soft p-5">
        {wordCount === null ? (
          <p className="text-sm text-fg-muted">
            {typed === "" ? aiCheck.emptyHint : aiCheck.invalidWords}
          </p>
        ) : tooLong ? (
          <>
            <p className="text-sm font-bold text-fg">{aiCheck.tooLongTitle}</p>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              {aiCheck.tooLongBody}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <a
                href={links.zalo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
              >
                <IconMessage size={16} />
                Nhắn Zalo để báo giá
              </a>
              <a
                href={composeEmailHref(
                  `Báo giá check AI & đạo văn — ${wordCount} từ`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
              >
                Gửi email
              </a>
            </div>
          </>
        ) : (
          priced?.ok && (
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-[13px] text-fg-muted">
                {aiCheck.amountLabel} ·{" "}
                {aiCheckTiers.find((tier) => tier.id === priced.tier)?.label}
              </span>
              <span className="text-2xl font-bold tracking-tight text-primary">
                {formatVnd(priced.amountVnd)}
              </span>
            </div>
          )
        )}
      </div>

      <button
        type="submit"
        disabled={pending || !payable}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep disabled:opacity-50"
      >
        {pending ? aiCheck.paying : aiCheck.payLabel}
        {!pending && <IconArrow size={16} />}
      </button>
      <p className="mt-3 text-center text-xs leading-relaxed text-fg-subtle">
        Cần đăng nhập để đặt dịch vụ — đơn được lưu trong trang tài khoản của
        bạn. Thanh toán qua PayOS (quét QR hoặc chuyển khoản); sau khi trả, bạn
        được đưa về trang có mã đơn để gửi bài qua Zalo. Bảng giá áp dụng đến{" "}
        {WORD_LIMIT.toLocaleString("vi-VN")} từ.
      </p>
    </form>
  );
}
