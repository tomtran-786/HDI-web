import type { ResearchStage } from "./generated/prisma/enums";

/**
 * A profile is complete once we have the two things Google cannot tell us.
 *
 * Derived rather than stored as a `profileCompletedAt` flag: with a flag, an
 * account whose phone is later cleared still counts as complete and quietly
 * skips the form. One source of truth, no drift.
 */
export function isProfileComplete(user: {
  phone: string | null;
  stage: ResearchStage | null;
}) {
  return PHONE_RE.test(normalizePhone(user.phone ?? "")) && user.stage !== null;
}

/** Vietnamese mobile numbers, the same shape the donor codebase validates. */
export const PHONE_RE = /^(0|\+84)[0-9]{9,10}$/;

export function normalizePhone(raw: string) {
  return raw.replace(/[\s.\-()]/g, "");
}

/** Digits-only domestic form used in the bank-transfer description. */
export function phoneForTransfer(raw: string | null | undefined) {
  const normalized = normalizePhone(raw ?? "");
  if (!PHONE_RE.test(normalized)) return null;
  return normalized.startsWith("+84") ? `0${normalized.slice(3)}` : normalized;
}
