/** Hình dạng feedback hợp lệ — phần thuần dùng chung client và server. */

export const TITLE_MAX = 160;
export const BODY_MAX = 5000;
export const PAGE_PATH_MAX = 300;
export const FEEDBACK_KINDS = ["bug", "idea"] as const;

export type FeedbackKindInput = (typeof FEEDBACK_KINDS)[number];

export function normalizeKind(value: unknown): FeedbackKindInput | null {
  return typeof value === "string" && FEEDBACK_KINDS.includes(value as FeedbackKindInput)
    ? (value as FeedbackKindInput)
    : null;
}

function normalizeText(value: unknown, max: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeTitle(value: unknown): string | null {
  return normalizeText(value, TITLE_MAX);
}

export function normalizeBody(value: unknown): string | null {
  return normalizeText(value, BODY_MAX);
}

/** Chỉ lưu pathname nội bộ; query và origin không có lý do đi vào database. */
export function normalizePagePath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const path = value.trim();
  return path.startsWith("/") ? path.slice(0, PAGE_PATH_MAX) : null;
}
