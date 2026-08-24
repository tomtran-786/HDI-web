/**
 * The centre, and the academic adviser behind it.
 *
 * The page leads with HDI Research Center; Dr. Tam Trinh appears under it as
 * `advisor` — his role is academic adviser, not the identity of the centre, so
 * nothing here may present him as its subject again.
 *
 * The centre's own `paragraphs` restate only what other content files already
 * claim: the four coaching programmes in content/programs.ts, the five courses
 * in content/course.ts, and the two manuscript services in content/services.ts.
 * No fact about the centre is invented here.
 *
 * `advisor` prose is translated from reference/site/pages/bio.md; education and
 * research interests from reference/site/docs/cv.pdf. Institution names, degree
 * names and journal names are kept in English exactly as published.
 */

export const about = {
  eyebrow: "Về chúng tôi",
  title: "HDI Research Center",
  subtitle:
    "Nghiên cứu bài bản, công bố quốc tế — học trực tuyến, đồng hành đến khi bài được gửi đăng",
  illustration: { src: "/images/successful-target.webp" },
  paragraphs: [
    "HDI Research Center là nơi huấn luyện nghiên cứu và công bố quốc tế cho sinh viên, học viên cao học, nghiên cứu sinh và giảng viên. Trung tâm làm việc trên ba tuyến: bốn chương trình kèm cặp theo từng giai đoạn của một công trình nghiên cứu (Coach Session, Research Class, Publication Class, Revise & Resubmit), năm khóa đào tạo đi từ bài tiểu luận đầu tiên đến kinh tế lượng nâng cao và bài báo tạp chí, cùng hai dịch vụ hỗ trợ bản thảo trước khi gửi đăng là kiểm tra AI & đạo văn và humanizing – proofreading.",
    "Tất cả các lớp đều học trực tuyến qua Zoom và có record xem lại trong 2 – 3 năm kể từ ngày đăng ký, nên người học ở bất cứ đâu cũng theo được. Trung tâm cũng không dừng lại khi lớp kết thúc: mỗi khóa đều có phần tư vấn riêng cho đề tài của từng học viên, và khóa viết báo cáo khoa học có thêm ba tháng đồng hành sau khóa để bản thảo thật sự tới được tòa soạn.",
  ],
  advisor: {
    label: "Cố vấn học thuật",
    name: "Dr. Tam Trinh",
    credential: "PhD in Economics, Deakin University",
    portrait: {
      src: "/images/portrait.jpg",
      alt: "Chân dung Dr. Tam Trinh",
    },
    paragraphs: [
      "Dr. Trinh nhận bằng PhD in Economics tại Deakin University, Australia với luận án “Non-life Insurance Expenditure in Developed and Developing Economies”. Vị trí học thuật toàn thời gian gần nhất của ông là Lecturer in Economics tại International University – VNU HCMC.",
      "Ông đã chủ trì nhiều đề tài nghiên cứu với nguồn tài trợ nội bộ từ International University — Vietnam National University HCMC, tập trung vào đổi mới xanh, chuyển đổi số và kinh tế học văn hóa: một đề tài hai năm về tri thức xanh và hiệu quả doanh nghiệp (US$31,000), một nghiên cứu về đổi mới sản phẩm và phong cách lãnh đạo (US$4,200), và một nghiên cứu về khoảng cách văn hóa và thương mại song phương (US$2,100).",
      "Hướng nghiên cứu của ông gồm kinh tế học ứng dụng, kinh tế học tài chính và các khía cạnh kinh tế của ngành bảo hiểm, du lịch, thương mại quốc tế, hành vi tiết kiệm và khởi nghiệp tại các nền kinh tế đang phát triển. Ông đã công bố trên Applied Economics, Economic Modelling, Economics of Transition (đều A-ranked trong danh mục ABDC), Research in International Business and Finance và The North American Journal of Economics and Finance (B-ranked, ABDC).",
      "Ngoài nghiên cứu, Dr. Trinh gắn bó với việc xây dựng một cộng đồng học thuật biết nâng đỡ nhau. Ông có nhiều kinh nghiệm hướng dẫn sinh viên và các nhà nghiên cứu trẻ từ cả doanh nghiệp lẫn học thuật trong thời gian giảng dạy tại International University – Vietnam National University, cũng như khi thỉnh giảng tại Deakin University (Australia), University of Economics and Law, Foreign Trade University, Ho Chi Minh City Open University và Banking University Ho Chi Minh City.",
      "Ông cũng có gần 10 năm làm việc trong ngành bảo hiểm, từng giữ vị trí Giám đốc chi nhánh và Phó giám đốc tại TP. Hồ Chí Minh cho Bao Viet Insurance — công ty bảo hiểm lớn nhất Việt Nam. Ông được công nhận là Fellow CIP (ANZIIF) từ năm 2017 và mang song tịch Australia – Việt Nam.",
    ],
    education: [
      {
        degree: "PhD in Economics",
        school: "Deakin University, Australia (ranked #265 THE, #17 in Australia)",
        year: "2017",
        note: "Luận án: Non-life Insurance Expenditure in Developed and Developing Economies",
      },
      {
        degree: "Master of Commerce (Insurance & Risk Management)",
        school: "Deakin University, Australia",
        year: "2013",
      },
      {
        degree: "Master of Business Administration",
        school: "University of Hong Bang International, Viet Nam",
        year: "2011",
      },
      {
        degree: "Bachelor of Engineering (Petrochemical Engineering)",
        school: "Ho Chi Minh City University of Technology, Viet Nam",
        year: "2005",
      },
    ],
    // From the course flyer (reference/site/images/image-53a4a7a37922.png).
    honors: ["Excellent research award, VNU-HCMC (2023)"],
    interests: [
      "Applied Economics",
      "Insurance Economics",
      "International Trade",
      "Tourism",
      "Saving behaviour",
      "National Culture",
    ],
    refereeFor: [
      "Economic Modelling",
      "Journal of International Trade and Economic Development",
      "Humanities and Social Sciences Communications",
      "SN Business and Economics",
    ],  },
};
