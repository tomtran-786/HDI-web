/**
 * The four research-support pathways provided by the owner in
 * PHAM-VI-CAP-NHAT-NOI-DUNG.md §3.2.
 */

export type Program = {
  name: string;
  nameVi: string;
  summary: string;
  bestFor: string;
  supportLabel: string;
  support: string[];
  icon: "user" | "users" | "journal" | "revise";
};

export const programsIntro = {
  eyebrow: "Đồng hành nghiên cứu",
  title: "Lộ trình đồng hành nghiên cứu",
  subtitle:
    "Bốn lộ trình được thiết kế cho bốn giai đoạn khác nhau của một công trình nghiên cứu.",
  intro:
    "Khác với các khóa đào tạo theo giáo trình cố định, mỗi lộ trình đồng hành được triển khai dựa trên đề tài, bản thảo, tiến độ và mục tiêu thực tế của người học.",
  note: "Mỗi chương trình đều có phiên bản tiếng Việt hoặc tiếng Anh, học trực tuyến qua Zoom.",
};

export const programs: Program[] = [
  {
    name: "Research Coaching 1:1",
    nameVi: "Cố vấn nghiên cứu 1–1",
    summary:
      "Cố vấn trực tiếp theo đề tài, tiến độ và mục tiêu nghiên cứu riêng của từng học viên.",
    bestFor:
      "Sinh viên, học viên cao học, nghiên cứu sinh và giảng viên cần tháo gỡ một vấn đề cụ thể trong nghiên cứu.",
    supportLabel: "Có thể hỗ trợ",
    support: [
      "Xác định câu hỏi và khoảng trống nghiên cứu",
      "Góp ý mô hình và giả thuyết",
      "Lựa chọn dữ liệu và phương pháp",
      "Đọc kết quả và định hướng bước tiếp theo",
      "Tư vấn chiến lược phát triển bản thảo",
    ],
    icon: "user",
  },
  {
    name: "Research Project Mentoring",
    nameVi: "Đồng hành thực hiện đề tài",
    summary:
      "Lộ trình đồng hành theo nhóm nhỏ, giúp người học từng bước phát triển một đề tài nghiên cứu thực tế dưới sự hướng dẫn của đội ngũ HDI.",
    bestFor:
      "Người mới bắt đầu nghiên cứu hoặc đang thực hiện đề tài, khóa luận và luận văn.",
    supportLabel: "Nội dung đồng hành",
    support: [
      "Hoàn thiện câu hỏi nghiên cứu",
      "Xây dựng tổng quan tài liệu",
      "Phát triển mô hình và giả thuyết",
      "Lựa chọn phương pháp nghiên cứu",
      "Chuẩn bị và phân tích dữ liệu",
      "Hoàn thiện cấu trúc công trình",
    ],
    icon: "users",
  },
  {
    name: "Publication Mentoring",
    nameVi: "Đồng hành phát triển bản thảo",
    summary:
      "Đồng hành cùng tác giả trong quá trình phát triển nghiên cứu thành bản thảo có cấu trúc và chất lượng phù hợp để gửi đến tạp chí khoa học.",
    bestFor:
      "Giảng viên, nghiên cứu sinh và nhà nghiên cứu trẻ đã có đề tài, dữ liệu hoặc bản thảo ban đầu.",
    supportLabel: "Nội dung đồng hành",
    support: [
      "Đánh giá mức độ sẵn sàng của nghiên cứu",
      "Hoàn thiện cấu trúc bài báo",
      "Làm rõ đóng góp lý thuyết và thực tiễn",
      "Góp ý phương pháp và cách trình bày kết quả",
      "Định hướng lựa chọn tạp chí phù hợp",
      "Chuẩn bị bản thảo và tài liệu gửi bài",
      "Hỗ trợ góp ý trả lời các câu hỏi trong quá trình phản biện",
    ],
    icon: "journal",
  },
  {
    name: "Revision & Resubmission Support",
    nameVi: "Hỗ trợ sửa bài và phản hồi phản biện",
    summary:
      "Hỗ trợ tác giả phân tích nhận xét của biên tập viên và phản biện, xây dựng chiến lược chỉnh sửa và chuẩn bị thư phản hồi trước khi gửi lại bản thảo.",
    bestFor:
      "Tác giả đã nhận quyết định revision, revise and resubmit hoặc yêu cầu bổ sung từ tạp chí.",
    supportLabel: "Nội dung hỗ trợ",
    support: [
      "Phân loại và diễn giải nhận xét",
      "Xây dựng bảng kế hoạch chỉnh sửa",
      "Góp ý cách xử lý từng vấn đề",
      "Kiểm tra sự nhất quán giữa bản thảo và thư phản hồi",
      "Hoàn thiện response letter",
      "Rà soát hồ sơ trước khi resubmit",
    ],
    icon: "revise",
  },
];
