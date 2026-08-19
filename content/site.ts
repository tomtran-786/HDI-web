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

export const nav = [
  { label: "Chương trình", href: "#chuong-trinh" },
  { label: "Khóa học", href: "#khoa-hoc" },
  { label: "Dịch vụ", href: "#dich-vu" },
  { label: "Về chúng tôi", href: "#ve-chung-toi" },
  { label: "Công bố", href: "#cong-bo" },
  { label: "Liên hệ", href: "#lien-he" },
] as const;

export const contact = {
  email: "congtam.trinh@gmail.com",
  phone: "0939 979 890",
  phoneHref: "tel:+84939979890",
  phoneNote: "Ưu tiên liên hệ qua Zalo",
} as const;

export const links = {
  register: "https://forms.gle/YXXfYAgPgmksqdCb9",
  linktree: "https://linktr.ee/minandkin",
  tiktok: "https://www.tiktok.com/@minandkin.official",
  legacySite: "https://www.congtamtrinh.com/",
  cv: "/docs/cv.pdf",
  teachingStatement: "/docs/teaching-statement.pdf",
} as const;
