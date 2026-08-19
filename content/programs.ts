/**
 * The four coaching programs.
 * Source: the programme table in reference/site/images/image-1b5466b247b2.jpg,
 * linked from reference/site/pages/coaching.md.
 * Programme names are kept in English exactly as published.
 */

export type Program = {
  name: string;
  summary: string;
  bestFor: string;
  icon: "user" | "users" | "journal" | "revise";
};

export const programsIntro = {
  eyebrow: "Chương trình",
  title: "Chương trình kèm cặp",
  subtitle: "Bốn lộ trình cho bốn giai đoạn khác nhau của một công trình nghiên cứu",
  note: "Mỗi chương trình đều có phiên bản tiếng Việt hoặc tiếng Anh, học trực tuyến qua Zoom.",
};

export const programs: Program[] = [
  {
    name: "Coach Session",
    summary:
      "Kèm cặp 1-1 theo đúng đề tài, tiến độ và mục tiêu của riêng bạn.",
    bestFor: "Sinh viên đại học, học viên cao học và nghiên cứu sinh",
    icon: "user",
  },
  {
    name: "Research Class",
    summary:
      "Lớp học theo nhóm về câu hỏi nghiên cứu, tổng quan tài liệu, phương pháp và Stata căn bản.",
    bestFor: "Người mới bước vào nghiên cứu",
    icon: "users",
  },
  {
    name: "Publication Class",
    summary:
      "Hỗ trợ trọn gói từ khâu viết bài đến khi gửi đăng tạp chí khoa học.",
    bestFor: "Giảng viên và nhà nghiên cứu ở giai đoạn đầu sự nghiệp",
    icon: "journal",
  },
  {
    name: "Revise & Resubmit",
    summary:
      "Hỗ trợ chiến lược phản hồi nhận xét của phản biện và hoàn thiện bản thảo.",
    bestFor: "Tác giả đang trong vòng phản biện",
    icon: "revise",
  },
];
