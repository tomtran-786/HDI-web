/**
 * Headline numbers. Each is counted directly from the content files in this
 * directory, which in turn come from reference/site — nothing here is estimated.
 *
 * Stored as numbers rather than display strings so the board can count up to
 * them. `prefix`/`suffix` carry everything that is not part of the number, and
 * `grouped` asks for thousands separators — the formatting lives in the
 * component so the animated frames and the final value are produced the same
 * way.
 */

export type Stat = {
  to: number;
  label: string;
  prefix?: string;
  suffix?: string;
  grouped?: boolean;
};

export const stats: Stat[] = [
  { to: 25, suffix: "+", label: "Công bố quốc tế" },
  { to: 15, suffix: "+", label: "Hội thảo quốc tế" },
  { to: 37300, prefix: "US$", grouped: true, label: "Tài trợ nghiên cứu" },
  { to: 10, suffix: "+", label: "Năm nghiên cứu & giảng dạy" },
];
