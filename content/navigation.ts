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
  // "Hồ sơ học thuật" gộp vào đây làm mục con thay vì đứng riêng — hai mục cùng
  // nói về trung tâm, tách ra chỉ làm thanh nav dài thêm.
  {
    label: "Về HDI",
    href: "/ve-hdi",
    groups: [
      {
        label: "Giới thiệu",
        children: [{ label: "Hồ sơ học thuật", href: "/cong-bo" }],
      },
    ],
  },
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
          {
            label: "Humanizing & Proofreading",
            href: "/dich-vu/humanizing-proofreading",
          },
        ],
      },
    ],
  },
  // Tách riêng khỏi dropdown "Dịch vụ": đây là dịch vụ có bảng giá công khai,
  // thanh toán trực tuyến ngay, nên nó đứng một mục để khách vào thẳng.
  { label: "Kiểm tra AI & Đạo văn", href: "/kiem-tra-ai-dao-van" },
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
            label: "Phân tích định lượng với SPSS & Stata",
            href: "/khoa-hoc/nckh-chuyen-sau-spss",
          },
          {
            label: "Nghiên cứu với SPSS & SmartPLS",
            href: "/khoa-hoc/spss-smartpls-ai",
          },
          {
            label: "Kinh tế lượng ứng dụng với Stata",
            href: "/khoa-hoc/kinh-te-luong-stata-ai",
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
            label: "NCKH ứng dụng AI & xuất bản quốc tế",
            href: "/khoa-hoc/nckh-ung-dung-ai-xuat-ban-quoc-te",
          },
          {
            label: "Ứng dụng ChatGPT trong NCKH",
            href: "/khoa-hoc/ung-dung-chatgpt-nckh",
          },
        ],
      },
    ],
  },
  // Hiện cho mọi người, kể cả khách chưa đăng nhập: chương trình chỉ chạy được
  // khi người ta biết nó tồn tại, và `/gioi-thieu-ban-be` lo phần đưa khách qua
  // màn đăng nhập rồi trả về đúng chỗ.
  { label: "Giới thiệu bạn bè", href: "/gioi-thieu-ban-be" },
  { label: "Liên hệ", href: "/#lien-he" },
];

/** Footer chỉ hiển thị các hub/cha, không bung item trong dropdown. */
export const footerNav = nav.map(({ label, href }) => ({ label, href }));
