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
  // The centre is the subject of the page; the professor advises it. Keep the
  // role next to the name everywhere it renders, so no surface can imply that
  // HDI is one person again.
  lead: {
    role: "Cố vấn Học thuật Trưởng",
    roleEn: "Lead Academic Advisor",
    name: "Dr. Tam Trinh",
    credential: "PhD in Economics, Deakin University",
  },
} as const;

export const contact = {
  email: "hdiresearchgroup@gmail.com",
  phone: "0333443388",
  phoneHref: "tel:+84333443388",
  phoneNote: "Ưu tiên liên hệ qua Zalo",
} as const;

/**
 * Every "gửi email" button points here rather than at `mailto:`. A mailto link
 * only does something when the device has a default mail client registered —
 * on the desktop browsers most readers use, clicking one is silently a no-op.
 * The address is a Gmail one and so is the audience's, so Gmail's compose
 * window is the destination that actually opens.
 */
export function composeEmailHref(subject?: string): string {
  const params = new URLSearchParams({ view: "cm", fs: "1", to: contact.email });
  if (subject) params.set("su", subject);
  return `https://mail.google.com/mail/?${params.toString()}`;
}

export const links = {
  // The intake Google Form is no longer linked from the page: consultation now
  // lands on #lien-he (Zalo, email, phone) and registration starts an account.
  // Kept here only because the form still holds historical responses — nothing
  // renders it. Delete once those responses have been exported.
  legacyForm: "https://forms.gle/YXXfYAgPgmksqdCb9",
  // Same number as `contact.phoneHref`, in the form zalo.me expects: country
  // code without "+", no spaces. `contact.phoneNote` tells people to prefer
  // Zalo, so the page has to actually give them a way there.
  zalo: "https://zalo.me/84333443388",
  // Điền URL fanpage tại đây là bubble Facebook trong contact dock tự hiện.
  fanpage: "https://www.facebook.com/profile.php?id=61593664414893",
  linktree: "https://linktr.ee/minandkin",
  tiktok: "https://www.tiktok.com/@minandkin.official",
  legacySite: "https://www.congtamtrinh.com/",
  cv: "/docs/cv.pdf",
  teachingStatement: "/docs/teaching-statement.pdf",
} as const;

export const contactDock = [
  {
    key: "zalo",
    label: "Nhắn Zalo",
    value: contact.phone,
    href: links.zalo,
    target: "_blank",
    tone: "primary",
  },
  {
    key: "phone",
    label: "Gọi điện",
    value: contact.phone,
    href: contact.phoneHref,
    target: null,
    tone: "success",
  },
  {
    key: "email",
    label: "Gửi email",
    value: contact.email,
    href: composeEmailHref(),
    target: "_blank",
    tone: "cool",
  },
  {
    key: "fanpage",
    label: "Facebook",
    value: "Fanpage HDI",
    href: links.fanpage,
    target: "_blank",
    tone: "cool",
  },
] as const;
