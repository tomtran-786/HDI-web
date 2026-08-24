import { Fragment, createElement, type ReactNode } from "react";

type InlineMatch = RegExpExecArray & {
  1: string;
  2: string | undefined;
  3: string | undefined;
  4: string | undefined;
  5: string | undefined;
  6: string | undefined;
  7: string | undefined;
};

const inlineToken =
  /(!?\[([^\]]*)\]\(([^)\s]+)\)|\*\*([^*\n]+)\*\*|~~([^~\n]+)~~|`([^`\n]+)`|\*([^*\n]+)\*)/g;

function safeHref(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function renderInline(value: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let cursor = 0;
  let index = 0;
  inlineToken.lastIndex = 0;

  for (let raw = inlineToken.exec(value); raw; raw = inlineToken.exec(value)) {
    const match = raw as InlineMatch;
    if (match.index > cursor) parts.push(value.slice(cursor, match.index));
    const key = `${keyPrefix}-${index++}`;
    const token = match[1];

    if (match[2] !== undefined && match[3] !== undefined) {
      const href = safeHref(match[3]);
      const image = token.startsWith("!");
      const label = image ? `Ảnh: ${match[2] || match[3]}` : match[2] || match[3];
      parts.push(
        href
          ? createElement(
              "a",
              {
                key,
                href,
                target: "_blank",
                rel: "noopener noreferrer nofollow",
                className: "font-semibold text-primary underline underline-offset-2",
              },
              label,
            )
          : createElement(Fragment, { key }, label),
      );
    } else if (match[4] !== undefined) {
      parts.push(createElement("strong", { key }, match[4]));
    } else if (match[5] !== undefined) {
      parts.push(createElement("s", { key }, match[5]));
    } else if (match[6] !== undefined) {
      parts.push(
        createElement(
          "code",
          { key, className: "rounded bg-bg-soft px-1.5 py-0.5 font-mono text-[0.9em]" },
          match[6],
        ),
      );
    } else if (match[7] !== undefined) {
      parts.push(createElement("em", { key }, match[7]));
    }

    cursor = match.index + token.length;
  }

  if (cursor < value.length) parts.push(value.slice(cursor));
  return parts;
}

function inlineWithBreaks(lines: string[], keyPrefix: string): ReactNode[] {
  return lines.flatMap((line, index) => [
    ...(index > 0 ? [createElement("br", { key: `${keyPrefix}-br-${index}` })] : []),
    ...renderInline(line, `${keyPrefix}-line-${index}`),
  ]);
}

/**
 * Render đúng tập Markdown mà toolbar feedback sinh ra, không tạo chuỗi HTML.
 * React tự escape mọi chữ của người dùng; URL ngoài http/https chỉ còn nhãn.
 */
export function renderMarkdown(markdown: string): ReactNode {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;
  let key = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (line.trim() === "") {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      index += 1;
      const code: string[] = [];
      while (index < lines.length && !lines[index].startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(
        createElement(
          "pre",
          {
            key: `block-${key++}`,
            className: "overflow-x-auto rounded-card bg-bg-soft p-4 font-mono text-sm leading-relaxed",
          },
          createElement("code", null, code.join("\n")),
        ),
      );
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push(
        createElement(
          "h2",
          { key: `block-${key++}`, className: "text-lg font-bold tracking-tight text-fg" },
          renderInline(line.slice(3), `h2-${key}`),
        ),
      );
      index += 1;
      continue;
    }

    if (line.startsWith("> ")) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].startsWith("> ")) {
        quote.push(lines[index].slice(2));
        index += 1;
      }
      blocks.push(
        createElement(
          "blockquote",
          {
            key: `block-${key++}`,
            className: "border-l-4 border-line pl-4 italic text-fg-muted",
          },
          inlineWithBreaks(quote, `quote-${key}`),
        ),
      );
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && lines[index].startsWith("- ")) {
        items.push(lines[index].slice(2));
        index += 1;
      }
      blocks.push(
        createElement(
          "ul",
          { key: `block-${key++}`, className: "list-disc space-y-1 pl-6" },
          items.map((item, itemIndex) =>
            createElement("li", { key: itemIndex }, renderInline(item, `ul-${key}-${itemIndex}`)),
          ),
        ),
      );
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s/, ""));
        index += 1;
      }
      blocks.push(
        createElement(
          "ol",
          { key: `block-${key++}`, className: "list-decimal space-y-1 pl-6" },
          items.map((item, itemIndex) =>
            createElement("li", { key: itemIndex }, renderInline(item, `ol-${key}-${itemIndex}`)),
          ),
        ),
      );
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() !== "" &&
      !lines[index].startsWith("```") &&
      !lines[index].startsWith("## ") &&
      !lines[index].startsWith("> ") &&
      !lines[index].startsWith("- ") &&
      !/^\d+\.\s/.test(lines[index])
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push(
      createElement(
        "p",
        { key: `block-${key++}`, className: "leading-relaxed" },
        inlineWithBreaks(paragraph, `p-${key}`),
      ),
    );
  }

  return createElement(
    "div",
    { className: "space-y-3 break-words text-[15px] text-fg" },
    blocks,
  );
}
