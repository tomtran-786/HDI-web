/**
 * The flagship 8-session course.
 * Every fact below — the eight session titles, the tuition, the group discount,
 * the format, the duration and the class hours — is transcribed from the course
 * flyer at reference/site/images/image-53a4a7a37922.png (linked from
 * pages/courses.md).
 *
 * The four `phases` names are the one exception: they are an editorial grouping
 * added so a reader can see the arc of the course at a glance. They are NOT text
 * from the flyer. The session titles under them keep the flyer's exact wording
 * and exact order, so "Buổi 1" … "Buổi 8" still map one-to-one onto the poster.
 */

export type CoursePhase = {
  name: string;
  sessions: string[];
};

export type Course = {
  slug: string;
  eyebrow: string;
  title: string;
  audience: string;
  intro: string;
  price: { amount: string; note: string };
  facts: { label: string; value: string }[];
  phases: CoursePhase[];
  outcomes: string[];
  registerNote: string;
};

export const courses: Course[] = [
  {
    slug: "viet-bao-cao-khoa-hoc",
    eyebrow: "Khóa đào tạo",
    title: "Viết báo cáo khoa học, luận văn chuẩn quốc tế",
    audience: "Dành cho sinh viên và học viên cao học",
    intro:
      "Tám buổi đi từ việc chọn đề tài đến lúc bấm nút gửi bài — kèm ba tháng đồng hành sau khóa để bản thảo thật sự tới được tòa soạn.",
    price: {
      amount: "1.000.000 đ",
      note: "Giảm 10% cho nhóm từ 03 người",
    },
    facts: [
      { label: "Hình thức", value: "Trực tuyến qua Zoom" },
      { label: "Thời lượng", value: "08 buổi / khóa — 02 buổi / tuần" },
      { label: "Giờ học", value: "19:30 – 21:00" },
    ],
    phases: [
      {
        name: "Định hình đề tài",
        sessions: [
          "Xác định chủ đề và hướng nghiên cứu",
          "Triển khai đề tài và viết proposal",
        ],
      },
      {
        name: "Tổng quan tài liệu",
        sessions: [
          "Tổng quan tài liệu — kỹ thuật tìm kiếm và lọc",
          "Viết Literature Review chuyên sâu",
        ],
      },
      {
        name: "Dữ liệu và phân tích",
        sessions: [
          "Dữ liệu và phân tích định lượng",
          "Thực hành hồi quy và đọc kết quả",
        ],
      },
      {
        name: "Viết và công bố",
        sessions: [
          "Thực chiến viết bài báo học thuật",
          "Gửi bài, chọn tạp chí và quy trình phản biện",
        ],
      },
    ],
    outcomes: [
      "Mỗi học viên có một đề tài rõ ràng và dàn ý bài báo đầy đủ.",
      "Ba tháng hỗ trợ sau khóa để hoàn thành bài viết và submit tạp chí dưới sự hướng dẫn của giảng viên.",
    ],
    registerNote:
      'Khi điền form đăng ký, chọn mục "Research Class (Advanced)" để vào đúng lớp học này.',
  },
];
