/**
 * Catalog điều hướng nhẹ. File này cố ý chỉ chứa nhãn và href để header client
 * không kéo toàn bộ curriculum, bảng giá hoặc review của khóa học vào bundle.
 */

export type NavChild = {
  label: string;
  href: string;
};

export type NavGroup = {
  label: string;
  children: readonly NavChild[];
};

export type NavItem = {
  label: string;
  href: string;
  groups?: readonly NavGroup[];
};

export const nav: readonly NavItem[] = [
  { label: "Về HDI", href: "/ve-hdi" },
  {
    label: "Dịch vụ",
    href: "/dich-vu",
    groups: [
      {
        label: "Đồng hành nghiên cứu",
        children: [
          {
            label: "Research Coaching 1:1",
            href: "/dich-vu/research-coaching-1-1",
          },
          {
            label: "Research Project Mentoring",
            href: "/dich-vu/research-project-mentoring",
          },
          {
            label: "Publication Mentoring",
            href: "/dich-vu/publication-mentoring",
          },
          {
            label: "Revision & Resubmission",
            href: "/dich-vu/revision-resubmission-support",
          },
        ],
      },
      {
        label: "Hỗ trợ bản thảo",
        children: [
          { label: "Kiểm tra AI & Đạo văn", href: "/kiem-tra-ai-dao-van" },
          {
            label: "Humanizing & Proofreading",
            href: "/dich-vu/humanizing-proofreading",
          },
        ],
      },
    ],
  },
  {
    label: "Khóa học",
    href: "/khoa-hoc",
    groups: [
      {
        label: "Nền tảng",
        children: [
          {
            label: "Viết tiểu luận, NCKH, KLTN",
            href: "/khoa-hoc/training-tieu-luan-nckh-kltn",
          },
        ],
      },
      {
        label: "Chuyên sâu",
        children: [
          {
            label: "NCKH chuyên sâu với SPSS",
            href: "/khoa-hoc/nckh-chuyen-sau-spss",
          },
          {
            label: "NCKH chuyên sâu với Stata",
            href: "/khoa-hoc/stata-kinh-te-luong",
          },
          {
            label: "Viết bài đăng tạp chí",
            href: "/khoa-hoc/viet-bai-tap-chi",
          },
        ],
      },
      {
        label: "Khóa đào tạo",
        children: [
          {
            label: "Viết báo cáo khoa học",
            href: "/khoa-hoc/viet-bao-cao-khoa-hoc",
          },
        ],
      },
      {
        label: "Công cụ AI",
        children: [
          {
            label: "Ứng dụng ChatGPT trong NCKH",
            href: "/khoa-hoc/ung-dung-chatgpt-nckh",
          },
        ],
      },
    ],
  },
  { label: "Hồ sơ học thuật", href: "/cong-bo" },
  { label: "Liên hệ", href: "/#lien-he" },
];

/** Footer chỉ hiển thị các hub/cha, không bung item trong dropdown. */
export const footerNav = nav.map(({ label, href }) => ({ label, href }));
