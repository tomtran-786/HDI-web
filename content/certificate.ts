/**
 * Giấy chứng nhận hoàn tất khóa học — chữ của dòng "Có giấy chứng nhận" ở card
 * học phí và của khối ảnh mẫu trên trang chi tiết khóa (components/course-certificate.tsx).
 *
 * NGUỒN: mẫu giấy chứng nhận do HDI cung cấp (khóa AIQT, đã in sẵn "SAMPLE /
 * MẪU"). Các ý bên dưới chỉ lấy từ chính ảnh mẫu; điều kiện để được cấp (tỷ lệ
 * chuyên cần, bài cuối khóa…) chưa có dữ liệu nên cố ý không ghi.
 */
export const certificate = {
  image: {
    src: "/images/chung-nhan-mau.jpg",
    width: 1395,
    height: 977,
    alt: "Mẫu giấy chứng nhận hoàn tất khóa học của HDI Research Center",
  },
  /** Id của khối trên trang — link "Xem mẫu" ở card học phí nhảy tới đây. */
  sectionId: "chung-nhan",
  note: {
    text: "Có giấy chứng nhận hoàn tất khóa học",
    link: "Xem mẫu",
  },
  eyebrow: "Chứng nhận",
  title: "Hoàn thành khóa học, nhận giấy chứng nhận",
  points: [
    "Song ngữ Anh – Việt, do HDI Research Center cấp",
    "Ghi họ tên, tên khóa, số buổi và thời gian học",
    "Có số chứng nhận riêng cho từng học viên",
    "Có chữ ký của giảng viên phụ trách khóa",
  ],
  caption:
    "Ảnh mẫu khóa AIQT — giấy chứng nhận của bạn ghi đúng họ tên và khóa bạn học.",
  zoom: {
    open: "Xem giấy chứng nhận mẫu cỡ lớn",
    close: "Đóng ảnh giấy chứng nhận mẫu",
    dialogTitle: "Giấy chứng nhận mẫu",
  },
  /** Giá trị cho `educationalCredentialAwarded` trong dữ liệu có cấu trúc. */
  credentialAwarded: "Giấy chứng nhận hoàn tất khóa học",
} as const;
