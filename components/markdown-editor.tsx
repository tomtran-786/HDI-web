"use client";

import { useRef, useState } from "react";
import { feedbackCopy } from "@/content/feedback";
import { BODY_MAX } from "@/lib/feedback-input";
import { renderMarkdown } from "@/lib/markdown-lite";
import {
  IconHeading,
  IconImage,
  IconLink,
  IconList,
  IconOrderedList,
  IconParagraph,
  IconQuote,
} from "./ui/icons";

type Edit = { text: string; selectionStart: number; selectionEnd: number };

const tools = [
  { action: "bold", label: "Đậm", content: <strong>B</strong> },
  { action: "italic", label: "Nghiêng", content: <em>I</em> },
  { action: "strike", label: "Gạch ngang", content: <s>S</s> },
  { action: "inline-code", label: "Mã trong dòng", content: <span className="font-mono">&lt;&gt;</span> },
  { action: "code-block", label: "Khối mã", content: <span className="font-mono text-[10px]">```</span> },
  { action: "heading", label: "Tiêu đề cấp 2", content: <IconHeading /> },
  { action: "paragraph", label: "Đoạn văn", content: <IconParagraph /> },
  { action: "quote", label: "Trích dẫn", content: <IconQuote /> },
  { action: "bullet-list", label: "Danh sách gạch đầu dòng", content: <IconList /> },
  { action: "ordered-list", label: "Danh sách đánh số", content: <IconOrderedList /> },
  { action: "link", label: "Liên kết", content: <IconLink /> },
  { action: "image", label: "Ảnh bằng URL", content: <IconImage /> },
] as const;

type ToolAction = (typeof tools)[number]["action"];

export function MarkdownEditor({ name }: { name: string }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("");
  const [tab, setTab] = useState<"compose" | "preview">("compose");

  function editSelection(makeEdit: (selected: string) => Edit) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const edit = makeEdit(textarea.value.slice(start, end));
    textarea.setRangeText(edit.text, start, end, "end");
    setValue(textarea.value);
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + edit.selectionStart,
        start + edit.selectionEnd,
      );
    });
  }

  function wrap(before: string, after: string, placeholder: string) {
    editSelection((selected) => {
      const content = selected || placeholder;
      return {
        text: `${before}${content}${after}`,
        selectionStart: before.length,
        selectionEnd: before.length + content.length,
      };
    });
  }

  function prefixLines(prefix: string, placeholder: string) {
    editSelection((selected) => {
      const content = selected || placeholder;
      const text = content
        .split("\n")
        .map((line) => `${prefix}${line}`)
        .join("\n");
      return { text, selectionStart: prefix.length, selectionEnd: text.length };
    });
  }

  function applyTool(action: ToolAction) {
    switch (action) {
      case "bold": return wrap("**", "**", "chữ đậm");
      case "italic": return wrap("*", "*", "chữ nghiêng");
      case "strike": return wrap("~~", "~~", "chữ gạch");
      case "inline-code": return wrap("`", "`", "mã");
      case "code-block": return wrap("```\n", "\n```", "mã");
      case "heading": return prefixLines("## ", "Tiêu đề");
      case "paragraph": return wrap("\n\n", "\n\n", "Đoạn văn");
      case "quote": return prefixLines("> ", "Trích dẫn");
      case "bullet-list": return prefixLines("- ", "Mục");
      case "ordered-list": return prefixLines("1. ", "Mục");
      case "link": return wrap("[", "](https://)", "chữ liên kết");
      case "image": return wrap("![", "](https://)", "mô tả ảnh");
    }
  }

  const overLimit = value.length > BODY_MAX;

  return (
    <div className="overflow-hidden rounded-card border border-line bg-card">
      <div className="flex flex-wrap gap-1 border-b border-line bg-bg-soft p-2">
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            aria-label={tool.label}
            title={tool.label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyTool(tool.action)}
            className="inline-flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm text-fg-muted transition hover:bg-card hover:text-primary"
          >
            {tool.content}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-line px-3 pt-2">
        <div role="tablist" aria-label="Chế độ soạn nội dung" className="flex gap-4">
          {(["compose", "preview"] as const).map((next) => (
            <button
              key={next}
              type="button"
              role="tab"
              aria-selected={tab === next}
              onClick={() => setTab(next)}
              className={`border-b-2 px-1 pb-2 text-sm font-bold transition ${
                tab === next
                  ? "border-primary text-primary"
                  : "border-transparent text-fg-subtle hover:text-fg"
              }`}
            >
              {next === "compose" ? feedbackCopy.compose : feedbackCopy.preview}
            </button>
          ))}
        </div>
        <span className="pb-2 text-xs text-fg-subtle">
          {feedbackCopy.markdownSupport}
        </span>
      </div>

      <textarea
        ref={textareaRef}
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={feedbackCopy.bodyPlaceholder}
        aria-label={feedbackCopy.bodyLabel}
        className={`min-h-52 w-full resize-y bg-card px-4 py-4 text-[15px] leading-relaxed text-fg outline-none placeholder:text-fg-subtle ${
          tab === "compose" ? "block" : "hidden"
        }`}
      />
      {tab === "preview" && (
        <div className="min-h-52 px-4 py-4">
          {value.trim() ? (
            renderMarkdown(value)
          ) : (
            <p className="text-sm text-fg-subtle">{feedbackCopy.emptyPreview}</p>
          )}
        </div>
      )}

      <p
        aria-live="polite"
        className={`border-t border-line px-4 py-2 text-right text-xs ${
          overLimit ? "font-bold text-danger" : "text-fg-subtle"
        }`}
      >
        {value.length} {feedbackCopy.characterCount}
      </p>
    </div>
  );
}
