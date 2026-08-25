/**
 * HDI Research Center, its operating model, academic principles and team.
 *
 * The centre copy and the new claims in the adviser profile — including the
 * Eurasian Economic Review editorial-board role — come from the owner-authored
 * PHAM-VI-CAP-NHAT-NOI-DUNG.md. Education, honours and referee journals retain
 * the sourced records that were already published on the site.
 *
 * The landing page deliberately renders only the two-paragraph summary. The
 * operating model, team, principles and academic foundation live at /ve-hdi so
 * the home page remains scannable.
 */

export const about = {
  eyebrow: "Về chúng tôi",
  title: "Về HDI Research Center",
  subtitle: "Nghiên cứu bài bản – Đồng hành thực chất – Hướng tới công bố",
  // Giữ SVG gốc thay vì bản WebP raster: asset có SMIL animation cho nhân vật,
  // lá cây và các chi tiết minh họa.
  illustration: { src: "/images/successful-target.svg" },
  paragraphs: [
    "HDI Research Center là cộng đồng huấn luyện và hỗ trợ nghiên cứu dành cho sinh viên, học viên cao học, nghiên cứu sinh, giảng viên và các nhà nghiên cứu trẻ. HDI đồng hành cùng người học từ bước hình thành ý tưởng, xây dựng câu hỏi nghiên cứu và lựa chọn phương pháp đến hoàn thiện bản thảo, gửi bài và phản hồi nhận xét của phản biện.",
    "Các chương trình của HDI được đội ngũ trợ lý nghiên cứu và điều phối viên triển khai dưới sự định hướng chuyên môn của Dr. Tam Trinh – Lead Academic Advisor.",
  ],
  identity: {
    mission: {
      title: "Sứ mệnh",
      paragraphs: [
        "HDI Research Center hướng đến việc giúp người học tiếp cận nghiên cứu khoa học theo phương pháp bài bản, dễ hiểu và có khả năng ứng dụng vào đề tài thực tế.",
        "HDI không chỉ cung cấp kiến thức lý thuyết mà còn tập trung hỗ trợ từng người học giải quyết những vấn đề cụ thể trong quá trình nghiên cứu: xác định khoảng trống nghiên cứu, xây dựng mô hình, lựa chọn dữ liệu và phương pháp, phân tích kết quả, trình bày bản thảo và chuẩn bị bài viết để gửi đến các tạp chí phù hợp.",
      ],
    },
    audience: {
      title: "Đối tượng phục vụ",
      lead: "Các chương trình của HDI được thiết kế cho:",
      items: [
        "Sinh viên đang thực hiện tiểu luận, đề tài nghiên cứu hoặc khóa luận tốt nghiệp",
        "Học viên cao học đang xây dựng đề cương hoặc viết luận văn",
        "Nghiên cứu sinh cần hỗ trợ về phương pháp và công bố",
        "Giảng viên, nhà nghiên cứu trẻ muốn phát triển bài báo khoa học",
        "Tác giả đang chuẩn bị bản thảo hoặc phản hồi nhận xét của tạp chí",
      ],
    },
    howWeWork: {
      title: "Phương thức hoạt động",
      paragraphs: [
        "HDI triển khai các chương trình đào tạo, kèm cặp và hỗ trợ bản thảo trực tuyến. Người học được tiếp cận học liệu, các buổi hướng dẫn chuyên môn và sự hỗ trợ phù hợp với đề tài, tiến độ và mục tiêu nghiên cứu của mình.",
        "Các hoạt động chính bao gồm:",
      ],
      items: [
        "Khóa học nghiên cứu và công bố khoa học",
        "Kèm cặp theo cá nhân hoặc nhóm",
        "Hỗ trợ phương pháp định lượng và sử dụng phần mềm",
        "Ứng dụng AI có kiểm soát trong nghiên cứu",
        "Hỗ trợ hoàn thiện bản thảo trước khi gửi đăng",
        "Tư vấn lựa chọn tạp chí và phản hồi phản biện",
      ],
    },
  },
  model: {
    title: "Mô hình đồng hành",
    subtitle: "Một quy trình hỗ trợ có định hướng và phân công rõ ràng",
    chain: ["Cố vấn học thuật", "Đội ngũ trợ lý nghiên cứu", "Học viên"],
    layers: [
      {
        name: "Cố vấn học thuật",
        body: "Cố vấn học thuật định hướng nội dung chuyên môn, thiết kế chương trình, tư vấn phương pháp và giám sát chất lượng học thuật. Những vấn đề quan trọng liên quan đến mô hình nghiên cứu, phương pháp, kết quả và chiến lược công bố được xem xét dưới góc độ chuyên môn.",
      },
      {
        name: "Đội ngũ trợ lý nghiên cứu",
        body: "Các trợ lý hỗ trợ học viên trong quá trình tham gia chương trình, bao gồm chuẩn bị tài liệu, tổ chức dữ liệu, điều phối lớp học, theo dõi tiến độ và kết nối người học với cố vấn học thuật khi cần thiết.",
      },
      {
        name: "Học viên",
        body: "Mỗi học viên được khuyến khích chủ động phát triển năng lực nghiên cứu của chính mình. HDI cung cấp định hướng, công cụ và phản hồi chuyên môn, nhưng người học vẫn là người trực tiếp xây dựng và chịu trách nhiệm đối với công trình nghiên cứu.",
      },
    ],
  },
  principles: {
    title: "Nguyên tắc học thuật",
    items: [
      {
        name: "Chính trực nghiên cứu",
        body: "HDI đề cao tính trung thực, minh bạch và trách nhiệm trong toàn bộ quá trình nghiên cứu. Người học được hướng dẫn cách trích dẫn, sử dụng dữ liệu, trình bày kết quả và công bố nghiên cứu theo các chuẩn mực học thuật phù hợp.",
      },
      {
        name: "Tài liệu có căn cứ",
        body: "Các nhận định học thuật cần được xây dựng trên nguồn tài liệu có thể kiểm chứng. HDI khuyến khích người học ưu tiên các bài báo khoa học, báo cáo chính thức và nguồn dữ liệu đáng tin cậy, đồng thời kiểm tra sự phù hợp giữa nội dung được trích dẫn và tài liệu gốc.",
      },
      {
        name: "AI được sử dụng có kiểm soát",
        body: "HDI xem AI là công cụ hỗ trợ, không phải sự thay thế cho tư duy nghiên cứu. Người học được hướng dẫn sử dụng AI để tìm ý tưởng, tổ chức tài liệu, cải thiện cách trình bày và hỗ trợ quy trình làm việc, đồng thời phải kiểm chứng thông tin và chịu trách nhiệm đối với nội dung cuối cùng.",
      },
      {
        name: "Hỗ trợ theo nhu cầu thực tế",
        body: "Mỗi đề tài có câu hỏi, dữ liệu, phương pháp và khó khăn khác nhau. Vì vậy, HDI ưu tiên hỗ trợ dựa trên nhu cầu thực tế của từng học viên thay vì áp dụng một khuôn mẫu giống nhau cho mọi công trình.",
      },
      {
        name: "Phát triển năng lực lâu dài",
        body: "Mục tiêu của HDI không chỉ là giúp người học hoàn thành một bài viết. Quan trọng hơn, người học cần từng bước hình thành tư duy nghiên cứu, khả năng làm việc độc lập và năng lực tiếp tục thực hiện những công trình tiếp theo.",
      },
    ],
  },
  record: {
    title: "Hồ sơ học thuật",
    subtitle: "Nền tảng chuyên môn đứng sau các chương trình của HDI",
    paragraphs: [
      "Chất lượng các chương trình tại HDI được xây dựng trên kinh nghiệm nghiên cứu, giảng dạy, hướng dẫn và công bố quốc tế của cố vấn học thuật.",
      "Hồ sơ học thuật của Dr. Tam Trinh cung cấp thông tin chi tiết về:",
    ],
    items: [
      "Các công trình công bố trong nước và quốc tế",
      "Dự án và tài trợ nghiên cứu",
      "Hoạt động tại các hội thảo khoa học",
      "Kinh nghiệm hướng dẫn và giảng dạy",
      "Hoạt động biên tập và phản biện khoa học",
      "Các lĩnh vực nghiên cứu chuyên môn",
    ],
    cta: { label: "Khám phá hồ sơ học thuật", href: "/cong-bo" },
  },
  closing: {
    title: "Bắt đầu hành trình nghiên cứu cùng HDI",
    body: "Dù bạn mới bắt đầu một đề tài, đang xử lý dữ liệu, chuẩn bị gửi bài hay cần phản hồi nhận xét của tạp chí, HDI sẽ cùng bạn xác định chặng tiếp theo phù hợp.",
  },
  advisor: {
    label: "Cố vấn Học thuật Trưởng",
    labelEn: "Lead Academic Advisor",
    name: "Dr. Tam Trinh",
    credential: "PhD in Economics, Deakin University, Australia",
    portrait: {
      src: "/images/portrait.jpg",
      alt: "Chân dung Dr. Tam Trinh",
    },
    paragraphs: [
      "Dr. Tam Trinh có hơn 10 năm kinh nghiệm nghiên cứu, giảng dạy và hướng dẫn học thuật. Tại HDI Research Center, ông phụ trách định hướng chuyên môn, thiết kế chương trình, cố vấn phương pháp và giám sát chất lượng học thuật.",
      "Ông đã công bố hơn 25 công trình quốc tế, trong đó có các nghiên cứu trên Energy Economics (ABDC A*), Economic Modelling, International Review of Financial Analysis và Applied Economics (ABDC A), cùng nhiều tạp chí quốc tế uy tín khác. Các nghiên cứu của ông tập trung vào kinh tế học ứng dụng, bất bình đẳng, năng lượng xanh, tài chính bền vững, bảo hiểm, thương mại quốc tế và phát triển kinh tế.",
      "Dr. Trinh hiện là thành viên Ban Biên tập của Eurasian Economic Review (xếp hạng C theo ABDC; ESCI Q1). Ông cũng thường xuyên tham gia phản biện cho các tạp chí khoa học quốc tế và trong nước.",
      "Với vai trò học thuật nòng cốt tại HDI, Dr. Trinh đồng hành cùng đội ngũ trợ lý nghiên cứu trong việc hỗ trợ người học phát triển đề tài, nâng cao năng lực nghiên cứu và từng bước hướng tới công bố khoa học.",
    ],
    rolesAtHdi: [
      "Định hướng học thuật và phát triển chương trình",
      "Thiết kế nội dung đào tạo",
      "Cố vấn mô hình và phương pháp nghiên cứu",
      "Hướng dẫn chiến lược viết và công bố bài báo",
      "Giám sát chất lượng chuyên môn",
      "Hỗ trợ xử lý nhận xét của phản biện",
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
      "Kinh tế học ứng dụng",
      "Bất bình đẳng",
      "Năng lượng xanh",
      "Tài chính bền vững",
      "Bảo hiểm",
      "Thương mại quốc tế",
      "Phát triển kinh tế",
    ],
    refereeFor: [
      "Economic Modelling",
      "Journal of International Trade and Economic Development",
      "Humanities and Social Sciences Communications",
      "SN Business and Economics",
    ],
  },
  assistant: {
    label: "Research Assistant",
    labelVi: "Trợ lý Nghiên cứu",
    name: "Tuan Tran",
    portrait: {
      src: "/images/tuan-tran.jpg",
      alt: "Chân dung Tuan Tran",
    },
    paragraphs: [
      "Tuan Tran hỗ trợ công tác chuẩn bị tài liệu, tổ chức dữ liệu, điều phối lớp học và theo dõi tiến độ nghiên cứu của học viên. Tuan cũng là cầu nối giữa học viên, các chương trình đào tạo và cố vấn học thuật của HDI.",
    ],
    // Hồ sơ riêng của trợ lý nghiên cứu. Không gộp vào `links` trong
    // content/site.ts: hai tệp ở đó (cv.pdf, teaching-statement.pdf) là của cố
    // vấn học thuật, nên để chung sẽ không còn biết tài liệu nào của ai.
    profile: {
      portfolio: "https://tomtran-portfolio.vercel.app/",
      resume: "/docs/resume-tuan-tran.pdf",
    },
    rolesAtHdi: [
      "Hỗ trợ tìm kiếm và sắp xếp tài liệu",
      "Hỗ trợ tổ chức và quản lý dữ liệu",
      "Điều phối lớp học và học liệu",
      "Theo dõi tiến độ của học viên",
      "Hỗ trợ kết nối học viên với cố vấn học thuật",
    ],
  },
};
