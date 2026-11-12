"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  aiCheckFromPrices,
  aiCheckKinds,
  aiCheckTeaser,
  type AiCheckKind,
} from "@/content/ai-check";
import { quote } from "@/lib/ai-check-pricing";
import { trackCta } from "@/lib/analytics";
import { buttonClass } from "./ui/button";

/** Nhãn ngắn cho từng loại, vừa một ô trong dòng chương trình. */
const SHORT_LABEL: Record<AiCheckKind, string> = {
  ai: "Check AI",
  plagiarism: "Đạo văn",
  combo: "Combo",
};

/** 50_000 → "50K", như cách HDI ghi giá trên poster. */
function shortVnd(amount: number) {
  return `${Math.round(amount / 1000)}K`;
}

/**
 * "Phiên song song" của bảng chương trình ở trang chủ: tính giá kiểm tra AI &
 * đạo văn ngay tại chỗ.
 *
 * Chưa gõ gì thì ba ô hiện giá thấp nhất ("từ 50K"). Gõ số từ thì ba ô đổi sang
 * giá đúng bậc của bản thảo đó — tính bằng `quote()`, cùng hàm mà form ở trang
 * dịch vụ và server action dùng, nên con số ở đây không thể lệch con số PayOS
 * thu. Ba ô cũng là lựa chọn loại kiểm tra; nút "Đặt kiểm tra" mang số từ và
 * loại đã chọn sang /kiem-tra-ai-dao-van (trang đó đọc `soTu` và `dichVu`).
 */
export function AiCheckTeaser() {
  const [words, setWords] = useState("");
  const [kind, setKind] = useState<AiCheckKind>("ai");
  const inputId = useId();
  const hintId = useId();

  const typed = words.trim();
  const parsed = Number(typed);
  const wordCount = typed !== "" && Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  const tooLong = wordCount !== null && quote(wordCount, kind).ok === false;

  const params = new URLSearchParams({ dichVu: kind });
  if (wordCount !== null && !tooLong) params.set("soTu", String(wordCount));
  const href = `/kiem-tra-ai-dao-van?${params.toString()}#tinh-chi-phi`;

  return (
    <div className="mt-4 bg-tint px-4 py-5 sm:px-5">
      <div className="grid gap-x-8 gap-y-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0">
          <p className="font-cond text-[0.8125rem] font-bold tracking-[0.08em] text-accent-text uppercase">
            {aiCheckTeaser.label}
          </p>
          <Link
            href="/kiem-tra-ai-dao-van"
            className="mt-1 inline-block text-[1.0625rem] font-semibold text-fg hover:text-primary hover:underline hover:underline-offset-4"
          >
            {aiCheckTeaser.title}
          </Link>
          <p id={hintId} className="mt-0.5 text-sm text-fg-muted">
            {tooLong ? aiCheckTeaser.tooLong : aiCheckTeaser.hint}
          </p>
        </div>

        {/* Mobile: ô số từ và nút chung một hàng, ba ô giá xuống hàng dưới.
            Từ `sm`: tất cả trên một hàng. */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-3 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-4">
          <label htmlFor={inputId} className="block">
            <span className="text-[0.8125rem] text-fg-muted">{aiCheckTeaser.wordLabel}</span>
            <input
              id={inputId}
              inputMode="numeric"
              autoComplete="off"
              placeholder={aiCheckTeaser.wordPlaceholder}
              aria-describedby={hintId}
              value={words}
              onChange={(event) => setWords(event.target.value.replace(/[^\d]/g, ""))}
              className="mt-1 block h-11 w-full rounded-button sm:w-28 border border-line bg-bg px-3 font-cond text-lg font-bold outline-none transition placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:text-fg-subtle focus:border-primary"
            />
          </label>

          <fieldset className="order-last col-span-2 flex gap-1.5 sm:order-none">
            <legend className="sr-only">{aiCheckTeaser.kindLegend}</legend>
            {aiCheckKinds.map(({ id, label }) => {
              const priced = wordCount !== null ? quote(wordCount, id) : null;
              const value = priced?.ok ? shortVnd(priced.amountVnd) : shortVnd(aiCheckFromPrices[id]);
              const exact = priced?.ok === true;
              return (
                <label
                  key={id}
                  className="flex h-11 min-w-[4.75rem] cursor-pointer flex-col justify-center rounded-button border border-line bg-bg px-2.5 transition-colors hover:border-rule has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-fg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
                >
                  <input
                    type="radio"
                    name="home-ai-check-kind"
                    value={id}
                    checked={kind === id}
                    onChange={() => setKind(id)}
                    aria-label={
                      tooLong
                        ? label
                        : `${label}: ${exact ? "" : `${aiCheckTeaser.from} `}${value}`
                    }
                    className="sr-only"
                  />
                  <span className="text-[0.75rem] leading-none opacity-80">{SHORT_LABEL[id]}</span>
                  <span className="mt-1 font-cond text-lg leading-none font-bold whitespace-nowrap">
                    {!exact && (
                      <span className="text-[0.75rem] font-medium opacity-80">
                        {aiCheckTeaser.from}{" "}
                      </span>
                    )}
                    {tooLong ? "—" : value}
                  </span>
                </label>
              );
            })}
          </fieldset>

          <Link
            href={href}
            onClick={() => trackCta("home-ai-check", "kiem-tra")}
            className={buttonClass({ size: "md" })}
          >
            {aiCheckTeaser.cta}
          </Link>
        </div>
      </div>
    </div>
  );
}
