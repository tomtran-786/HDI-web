/**
 * Nguồn dữ liệu duy nhất cho toàn bộ dịch vụ của HDI.
 *
 * Bốn lộ trình nghiên cứu được chủ site cung cấp trong
 * PHAM-VI-CAP-NHAT-NOI-DUNG.md §3.2. Hai dịch vụ bản thảo được lấy từ các
 * trang nguồn tương ứng. Humanizing chưa có mô tả chi tiết, vì vậy catalog chỉ
 * giữ đúng lời mời liên hệ hiện có và landing của nó không dựng thêm block rỗng.
 */

export const SERVICE_SLUGS = [
  "research-coaching-1-1",
  "research-project-mentoring",
  "publication-mentoring",
  "revision-resubmission-support",
  "humanizing-proofreading",
] as const;

export type ServiceSlug = (typeof SERVICE_SLUGS)[number];
export type ServiceIcon = "user" | "users" | "journal" | "revise";

export type ServiceItem = {
  slug?: ServiceSlug;
  href: string;
  name: string;
  nameVi?: string;
  summary: string;
  bestFor?: string;
  supportLabel?: string;
  support?: readonly string[];
  icon?: ServiceIcon;
};

export type ServiceGroup = {
  id: "dong-hanh-nghien-cuu" | "ho-tro-ban-thao";
  eyebrow: string;
  title: string;
  subtitle: string;
  items: readonly ServiceItem[];
};

const researchServices: readonly ServiceItem[] = [
  {
    slug: "research-coaching-1-1",
    href: "/dich-vu/research-coaching-1-1",
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
    slug: "research-project-mentoring",
    href: "/dich-vu/research-project-mentoring",
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
    slug: "publication-mentoring",
    href: "/dich-vu/publication-mentoring",
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
    slug: "revision-resubmission-support",
    href: "/dich-vu/revision-resubmission-support",
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

const manuscriptServices: readonly ServiceItem[] = [
  {
    href: "/kiem-tra-ai-dao-van",
    name: "Kiểm tra AI & Đạo văn",
    nameVi: "Checking AI & similarity index",
    summary:
      "Bảng giá công khai theo độ dài bản thảo, từ 25.000đ. Nhập số từ để biết chi phí và thanh toán trực tuyến.",
  },
  {
    slug: "humanizing-proofreading",
    href: "/dich-vu/humanizing-proofreading",
    name: "Humanizing and Proofreading",
    summary: "Liên hệ để biết chi tiết và báo giá.",
  },
];

export const serviceCatalog = {
  eyebrow: "Dịch vụ",
  title: "Dịch vụ nghiên cứu và hỗ trợ bản thảo",
  subtitle:
    "Chọn đúng nhóm hỗ trợ theo giai đoạn hiện tại của đề tài hoặc bản thảo.",
  groups: [
    {
      id: "dong-hanh-nghien-cuu",
      eyebrow: "Đồng hành nghiên cứu",
      title: "Lộ trình đồng hành nghiên cứu",
      subtitle:
        "Bốn lộ trình được thiết kế cho bốn giai đoạn khác nhau của một công trình nghiên cứu.",
      items: researchServices,
    },
    {
      id: "ho-tro-ban-thao",
      eyebrow: "Hỗ trợ bản thảo",
      title: "Dịch vụ hỗ trợ bản thảo",
      subtitle: "Hai dịch vụ đi kèm cho bản thảo trước khi gửi đăng.",
      items: manuscriptServices,
    },
  ] satisfies readonly ServiceGroup[],
  researchIntro:
    "Khác với các khóa đào tạo theo giáo trình cố định, mỗi lộ trình đồng hành được triển khai dựa trên đề tài, bản thảo, tiến độ và mục tiêu thực tế của người học.",
  researchNote:
    "Mỗi chương trình đều có phiên bản tiếng Việt hoặc tiếng Anh, học trực tuyến qua Zoom.",
} as const;

export const services = serviceCatalog.groups.flatMap((group) => group.items);

export function serviceForSlug(slug: string): ServiceItem | undefined {
  return services.find((service) => service.slug === slug);
}
