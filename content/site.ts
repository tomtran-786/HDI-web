/**
 * Brand, navigation and contact details.
 * Facts sourced from reference/site/pages/contact.md and the course flyer
 * (reference/site/images/image-53a4a7a37922.png).
 */

export const site = {
  name: "HDI Research Center",
  short: "HDI",
  tagline: "Huấn luyện nghiên cứu & công bố quốc tế",
  blurb:
    "Đồng hành cùng sinh viên, học viên cao học và giảng viên trên hành trình từ ý tưởng nghiên cứu đến bài báo được đăng.",
  lead: {
    name: "Dr. Cong Tam Trinh",
    credential: "PhD in Economics, Deakin University",
  },
} as const;

/**
 * Absolute (`/#...`), not bare (`#...`): the header now renders on /tai-khoan
 * and /quan-tri too, where a bare hash would resolve against the current route
 * and go nowhere.
 */
export const nav = [
  { label: "Chương trình", href: "/#chuong-trinh" },
  { label: "Khóa học", href: "/#khoa-hoc" },
  { label: "Dịch vụ", href: "/#dich-vu" },
  { label: "Về chúng tôi", href: "/#ve-chung-toi" },
  { label: "Công bố", href: "/#cong-bo" },
  { label: "Liên hệ", href: "/#lien-he" },
] as const;

export const contact = {
  email: "congtam.trinh@gmail.com",
  phone: "0939 979 890",
  phoneHref: "tel:+84939979890",
  phoneNote: "Ưu tiên liên hệ qua Zalo",
} as const;

export const links = {
  // The intake Google Form is no longer linked from the page: consultation now
  // lands on #lien-he (Zalo, email, phone) and registration starts an account.
  // Kept here only because the form still holds historical responses — nothing
  // renders it. Delete once those responses have been exported.
  legacyForm: "https://forms.gle/YXXfYAgPgmksqdCb9",
  // Same number as `contact.phoneHref`, in the form zalo.me expects: country
  // code without "+", no spaces. `contact.phoneNote` tells people to prefer
  // Zalo, so the page has to actually give them a way there.
  zalo: "https://zalo.me/84939979890",
  linktree: "https://linktr.ee/minandkin",
  tiktok: "https://www.tiktok.com/@minandkin.official",
  legacySite: "https://www.congtamtrinh.com/",
  cv: "/docs/cv.pdf",
  teachingStatement: "/docs/teaching-statement.pdf",
} as const;
