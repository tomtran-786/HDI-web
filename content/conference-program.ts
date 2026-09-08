/**
 * Chương trình HDI đồng hành hội thảo quốc tế & cơ hội xuất bản.
 *
 * Biên tập từ "HỘI THẢO QUỐC TẾ VÀ CƠ HỘI XUẤT BẢN" do chủ site cung cấp. Đây là
 * một *chương trình dịch vụ* — khác với hồ sơ hội thảo cá nhân của Dr. Tâm Trịnh
 * ở `content/conferences.ts` (chỉ dùng trên `/cong-bo`). Tên tạp chí, nhà xuất
 * bản và chỉ mục giữ nguyên tiếng Anh như công bố; xếp hạng ghi theo thông báo
 * học thuật của từng hội thảo và có thể thay đổi theo năm.
 */

export type PublicationOutlet = {
  /** Tên ấn phẩm — tạp chí, kỷ yếu hoặc sách. */
  name: string;
  /** Nhà xuất bản và chỉ mục, gộp một dòng. */
  publisher: string;
  /** Xếp hạng hoặc tình trạng lập chỉ mục, kèm nguồn. */
  standing: string;
};

export type ConferenceForum = {
  id: "agba" | "ebes";
  eyebrow: string;
  name: string;
  /** Một câu định vị cho thẻ trên trang chủ. */
  positioning: string;
  /** Chip xếp hạng ngắn cho thẻ trên trang chủ. */
  outletChips: readonly string[];
  externalUrl: string;
  /** Các đoạn mô tả trên trang chi tiết. */
  body: readonly string[];
  /** Địa điểm / hình thức tổ chức, hiển thị dạng chip. */
  highlights: readonly string[];
  /** Các hướng công bố, dựng thành bảng trên trang chi tiết. */
  outlets: readonly PublicationOutlet[];
  /** Ghi chú làm nổi (quartile thay đổi, vai trò biên tập…). */
  note: string;
  /** HDI đồng hành cùng người tham dự diễn đàn này. */
  accompany: readonly string[];
  /** Câu miễn trừ — tham dự không đồng nghĩa được chấp nhận xuất bản. */
  disclaimer: string;
};

export type ProcessStep = { title: string; detail: string };

export const conferenceProgramIntro = {
  eyebrow: "Sau khóa học",
  title: "Hội thảo quốc tế & cơ hội xuất bản",
  subtitle:
    "HDI đồng hành cùng nghiên cứu sinh, học viên cao học và nhà nghiên cứu trẻ chuẩn bị, trình bày tại hội thảo quốc tế rồi hoàn thiện bài viết hướng tới công bố — dưới hướng dẫn của Dr. Tâm Trịnh.",
} as const;

const agba: ConferenceForum = {
  id: "agba",
  eyebrow: "Diễn đàn quốc tế cho nhà nghiên cứu trẻ",
  name: "AGBA World Congress",
  positioning:
    "Hội thảo thường niên của Academy for Global Business Advancement (Hoa Kỳ, từ năm 2000), thường tổ chức tại các thành phố gần Việt Nam — phù hợp cho lần trình bày quốc tế đầu tiên.",
  outletChips: ["Scopus Q2", "Scopus Q4", "Springer Nature"],
  externalUrl: "https://agba.us/",
  body: [
    "Academy for Global Business Advancement (AGBA) là tổ chức học thuật phi lợi nhuận thành lập tại Hoa Kỳ từ năm 2000, với mạng lưới thành viên đến từ hơn 50 quốc gia.",
    "Hội thảo thường niên của AGBA là diễn đàn để học giả, nghiên cứu sinh, chuyên gia và nhà quản lý cùng trình bày kết quả nghiên cứu, trao đổi học thuật và mở rộng mạng lưới hợp tác quốc tế.",
    "Với địa điểm thuận lợi và môi trường học thuật cởi mở, AGBA đặc biệt phù hợp với nghiên cứu sinh, học viên cao học và nhà nghiên cứu trẻ muốn có trải nghiệm trình bày quốc tế đầu tiên, nhận góp ý cho nghiên cứu và tìm cơ hội phát triển bài viết.",
  ],
  highlights: [
    "Bangkok, Thái Lan — AGBA 2025",
    "Kuala Lumpur, Malaysia — AGBA 2026",
    "TP. Hồ Chí Minh, Việt Nam — dự kiến AGBA 2027",
  ],
  outlets: [
    {
      name: "JIBED — Journal for International Business and Entrepreneurship Development",
      publisher: "Inderscience · Scopus & Web of Science · theo thông báo AGBA",
      standing: "Scopus Q2",
    },
    {
      name: "JGBA — Journal for Global Business Advancement",
      publisher: "Inderscience · Scopus · theo thông báo AGBA",
      standing: "Scopus Q4",
    },
    {
      name: "AGBA Refereed Conference Proceedings",
      publisher: "Springer Nature",
      standing: "Định hướng Scopus",
    },
    {
      name: "AGBA Global Case Book",
      publisher: "Springer Nature · sách tình huống giảng dạy",
      standing: "Định hướng Scopus",
    },
  ],
  note: "Xếp hạng Scopus có thể thay đổi theo năm và theo nhóm ngành; HDI sẽ kiểm tra lại tại thời điểm bạn chọn hướng nộp bài.",
  accompany: [
    "Đánh giá mức độ phù hợp của đề tài",
    "Hoàn thiện abstract và full paper",
    "Chuẩn hóa bài viết theo yêu cầu của hội thảo",
    "Chuẩn bị slide và bài trình bày",
    "Tổ chức thực hành thuyết trình trước hội thảo",
    "Hướng dẫn tiếp nhận góp ý và hoàn thiện bài sau hội thảo",
    "Tư vấn lựa chọn hướng công bố phù hợp với chất lượng bài viết",
  ],
  disclaimer:
    "AGBA áp dụng quy trình sàng lọc, phản biện và yêu cầu chỉnh sửa riêng cho từng hướng công bố. Tham dự hoặc trình bày tại hội thảo không đồng nghĩa với việc bài viết được tự động chấp nhận xuất bản.",
};

const ebes: ConferenceForum = {
  id: "ebes",
  eyebrow: "Hội thảo linh hoạt: trực tiếp hoặc trực tuyến",
  name: "EBES Conference",
  positioning:
    "Hội thảo của Eurasia Business and Economics Society về kinh tế, tài chính, kinh doanh và quản trị; cho phép trình bày trực tiếp tại chỗ hoặc trực tuyến trong phiên online riêng.",
  outletChips: ["SSCI", "Scopus", "Springer", "ABDC B & C"],
  externalUrl: "https://ebesweb.org/",
  body: [
    "Eurasia Business and Economics Society (EBES) tổ chức các hội thảo quốc tế trong lĩnh vực kinh tế, tài chính, kinh doanh và quản trị, thu hút nhà nghiên cứu từ nhiều quốc gia.",
    "Điểm nổi bật của EBES là hình thức tổ chức linh hoạt: tùy từng kỳ, người tham gia có thể trình bày trực tiếp tại địa điểm tổ chức hoặc trình bày trực tuyến trong các phiên online riêng.",
    "Sau hội thảo, người tham gia có thể gửi bài để được xem xét đăng trên hai tạp chí chính thức của EBES hoặc trong chuỗi kỷ yếu sách do Springer xuất bản.",
  ],
  highlights: [
    "Trình bày trực tiếp tại địa điểm tổ chức",
    "Hoặc trình bày trực tuyến trong phiên online riêng",
    "Kỳ 58 tổ chức kết hợp: 2 ngày trực tiếp, 1 ngày trực tuyến",
  ],
  outlets: [
    {
      name: "Eurasian Business Review — EABR",
      publisher: "SSCI, Scopus · Springer",
      standing: "ABDC 2025: B",
    },
    {
      name: "Eurasian Economic Review — EAER",
      publisher: "ESCI, Scopus · Springer",
      standing: "ABDC 2025: C",
    },
    {
      name: "Eurasian Studies in Business and Economics",
      publisher: "Springer · Scopus · phản biện do EBES quản lý",
      standing: "Kỷ yếu sách",
    },
  ],
  note: "Theo các chỉ số Scopus hiện hành, EABR và EAER đều có thể đạt Q1 ở một số nhóm ngành (quartile thay đổi theo năm và nhóm ngành — HDI kiểm tra lại khi bạn chọn hướng nộp). Dr. Tâm Trịnh hiện là thành viên Ban Biên tập của Eurasian Economic Review.",
  accompany: [
    "Kiểm tra lại quartile và phạm vi tạp chí tại thời điểm nộp bài",
    "Góp ý chọn giữa EABR, EAER và kỷ yếu Springer",
    "Chuẩn hóa bản thảo theo tiêu chuẩn và kỳ vọng của tạp chí",
    "Hỗ trợ chuẩn bị cho phiên trình bày trực tiếp hoặc trực tuyến",
    "Góp ý hoàn thiện bài sau hội thảo trước khi gửi đăng",
  ],
  disclaimer:
    "Mọi bài nộp cho tạp chí hoặc kỷ yếu EBES đều phải trải qua quy trình biên tập và phản biện độc lập; tham dự hội thảo không đồng nghĩa với việc bài viết được chấp nhận đăng.",
};

export const conferenceProgram = {
  lead: "HDI Research Center đồng hành cùng nghiên cứu sinh, học viên cao học, giảng viên và nhà nghiên cứu trẻ trong quá trình chuẩn bị và tham gia các hội thảo quốc tế uy tín, rồi tiếp tục hoàn thiện bài viết sau hội thảo để hướng tới xuất bản.",
  benefits: [
    "Lựa chọn hội thảo và hướng công bố phù hợp",
    "Hoàn thiện đề tài, abstract và bài nghiên cứu",
    "Chuẩn bị bài thuyết trình bằng tiếng Anh",
    "Thực hành trình bày và trả lời câu hỏi học thuật",
    "Kết nối với các nhà nghiên cứu quốc tế",
    "Hoàn thiện bài viết sau hội thảo để hướng tới xuất bản",
  ],
  forums: [agba, ebes] satisfies readonly ConferenceForum[],
  advisor: {
    paragraphs: [
      "Dr. Tâm Trịnh là nhà nghiên cứu trong lĩnh vực kinh tế học ứng dụng, có kinh nghiệm trình bày và công bố tại các hội thảo và tạp chí quốc tế.",
      "Kinh nghiệm này giúp người tham gia được hướng dẫn không chỉ về nội dung bài viết mà còn về cách chuẩn bị, trình bày, trao đổi và xây dựng quan hệ học thuật tại hội thảo quốc tế.",
      "Mục tiêu của HDI không chỉ là giúp bạn tham dự một hội thảo, mà còn giúp bạn biến trải nghiệm đó thành một bước tiến thực chất trong hành trình nghiên cứu và cơ hội công bố quốc tế.",
    ],
    roles: [
      "Session Chair — điều hành phiên trình bày học thuật",
      "Thành viên trong hoạt động tổ chức hội thảo",
      "Người trình bày và trao đổi nghiên cứu",
      "Người hướng dẫn nghiên cứu sinh, học viên cao học và nhà nghiên cứu trẻ",
      "Thành viên Ban Biên tập Eurasian Economic Review",
    ],
    since: "Tham gia cộng đồng học thuật EBES từ năm 2016",
  },
  process: [
    { title: "Đánh giá đề tài", detail: "Đánh giá đề tài và mức độ sẵn sàng của nghiên cứu." },
    { title: "Chọn hướng", detail: "Lựa chọn AGBA, EBES hoặc hướng công bố phù hợp." },
    { title: "Abstract & đăng ký", detail: "Tư vấn hoàn thiện abstract và đăng ký hội thảo." },
    { title: "Full paper", detail: "Góp ý phát triển bài nghiên cứu hoàn chỉnh." },
    { title: "Slide & thuyết trình", detail: "Góp ý chuẩn bị slide và thực hành thuyết trình." },
    { title: "Tại hội thảo", detail: "Đồng hành trong quá trình tham dự hội thảo." },
    { title: "Sau hội thảo", detail: "Góp ý hoàn thiện bài sau thuyết trình và tư vấn hướng gửi xuất bản." },
  ] satisfies readonly ProcessStep[],
  images: {
    hero: {
      src: "/images/hoi-thao-quoc-te-hero.jpg",
      alt: "Hai diễn giả trình bày trước hội trường đông kín tại một hội thảo quốc tế",
    },
    advisor: {
      src: "/images/hoi-thao-quoc-te-trinh-bay.jpg",
      alt: "Một diễn giả cầm micro trình bày trước khán phòng hội thảo",
    },
  },
} as const;
