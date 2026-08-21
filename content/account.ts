/**
 * Copy for the student area (/dang-nhap, /hoan-tat-ho-so, /tai-khoan).
 *
 * The five `stages` options are transcribed verbatim from the Google Form this
 * app replaces ("Bạn đang ở giai đoạn nào? / What stage are you at?"). Keeping
 * the wording identical means answers collected before and after the switch are
 * still the same question.
 */

export const stages = [
  { value: "undergraduate_thesis", label: "Viết luận văn đại học / Undergraduate thesis" },
  { value: "masters_thesis", label: "Viết luận văn Thạc sĩ / Master's thesis" },
  { value: "phd_research", label: "Nghiên cứu sinh Tiến sĩ / PhD research" },
  { value: "journal_article", label: "Viết bài báo quốc tế / Journal article writing" },
  { value: "other", label: "Khác / Others" },
] as const;

export type StageValue = (typeof stages)[number]["value"];

export const profileIntro = {
  eyebrow: "Hoàn tất hồ sơ",
  title: "Còn hai thông tin nữa",
  subtitle:
    "Google đã cung cấp họ tên và email của bạn. Hai mục dưới đây giúp chúng tôi xếp bạn đúng lớp và liên hệ khi cần.",
} as const;
