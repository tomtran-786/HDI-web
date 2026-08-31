/**
 * The courses listed in #khoa-hoc.
 *
 * SOURCES — most published facts below are transcribed from the sources noted
 * here. The merged SPSS & Stata course is the authored exception documented in
 * F.
 *
 * A. `viet-bao-cao-khoa-hoc` — the eight session titles, the tuition, the group
 *    discount, the format, the duration and the class hours all come from the
 *    course flyer at reference/site/images/image-53a4a7a37922.png (linked from
 *    pages/courses.md). Its four `phases` names are the one exception: an
 *    editorial grouping added so a reader can see the arc of the course. They
 *    are NOT text from the flyer. The session titles under them keep the
 *    flyer's exact wording and order, so "Buổi 1" … "Buổi 8" still map
 *    one-to-one onto the poster.
 *
 * B. Three of the others are transcribed from reference/edubit/courses/*.md,
 *    crawled from thayphongdang.edubit.vn by reference/scrape_edubit_courses.py.
 *    Syllabus, tuition, duration and class size are that site's own text.
 *    `training-tieu-luan-nckh-kltn` USED to belong here; see E.
 *
 * C. `ung-dung-chatgpt-nckh` is authored by HDI. Its curriculum, schedule and
 *    tuition are a draft pending the owner's final confirmation; unlike the
 *    five courses above, these details do not come from `reference/`.
 *
 * D. `nckh-ung-dung-ai-xuat-ban-quoc-te` is transcribed from the owner-supplied
 *    `HDI class.md` on 2026-08-25. The owner explicitly overrides its original
 *    opening date with 07/09/2026 and asks us not to publish a weekday schedule
 *    until the detailed timetable is ready.
 *
 * E. `training-tieu-luan-nckh-kltn` was re-authored on 2026-08-27 from an
 *    owner-supplied outline ("Viet tieu luan, Luan van va NCKH.md"). It is no
 *    longer the edubit course of the same name: the syllabus, the audience
 *    groups and the three-module structure are HDI's own, and the tuition
 *    (300.000 đ list, 250.000 đ each for groups of three or more) is HDI's own
 *    pricing rather than edubit's.
 *
 *    Two figures from the edubit version were DROPPED rather than carried over,
 *    because they describe the old course and nothing in the new outline
 *    supports them: a record library of "35 giờ 34 phút — 40 bài học", and a
 *    bundle of "19 tài liệu" of graded sample work. Re-add them only if the
 *    owner confirms they still hold.
 *
 * F. `nckh-chuyen-sau-spss` was merged with the former Stata course on
 * 2026-08-30 at the owner's request. Its title, six-session curriculum and
 * outcomes are an HDI-authored sketch. The price and access policy remain the
 * existing SPSS catalog values so the public content still matches its
 * existing commercial record. The old Stata slug is retained only as a public
 * redirect; no database record is changed.
 *
 * HISTORICAL ATTRIBUTION — recorded here because the page does not show it.
 * Before the merge, the edubit courses were taught by:
 *
 *    stata          TS. Trịnh Công Tâm — sole instructor, all 5 modules
 *    spss           PGS.TS. Phương Hữu Từng (M1, M2, M5, M6)
 *                   + TS. Trịnh Công Tâm (M3, M4)
 *    tap-chi        PGS.TS. Phương Hữu Từng (M1, M2, M6)
 *                   + PGS.TS. Dương Công Doanh (M3)
 *                   + TS. Trịnh Công Tâm (M4, M5)
 *    nckh-sinh-vien ThS. Đặng Văn Phong — sole instructor.
 *                   Dr. Trinh teaches NO part of this course.
 *
 * This historical block is retained for reference; it is not a claim about
 * the current merged course's instructor assignment.
 *
 * Tuition for the four edubit courses is that site's current price and will
 * drift if they reprice. Star ratings come only from approved HDI reviews.
 * The manually authored student counts are explicitly marketing copy and live
 * in content/course-hype.ts, separate from both this sourced content and real
 * enrollment data.
 *
 * WHY `facts` SPLITS "Lớp trực tiếp" FROM "Kho record" — every course here is
 * taught live on a schedule, with recordings as a catch-up benefit. The single
 * figure edubit prints as "Thời lượng" is the ACCUMULATED record library across
 * past intakes, not the length of one course. Adding up the per-intake records
 * in reference/edubit/courses/:
 *
 *    Stata    K1 11h20 + K2 11h05 + K3 10h26 + K4 6h15 (+ per-module detail
 *             ~8h) = 47h29 total, but ONE live intake is ~10–11h (5 modules)
 *    Tạp chí  K12 14h08 + K13 15h29 + K14 15h42 (+ detail ~14h) = 60h44 total,
 *             one intake ~15h (6 modules)
 *
 * Printing "Thời lượng: 47 giờ 29 phút" made readers think the course runs for
 * 47 hours. Splitting the rows states the same sourced numbers accurately — and
 * surfaces the record library as the benefit it is instead of burying it.
 */

/**
 * Một mục trong lộ trình. Chuỗi trần là dạng gọn nhất và vẫn là dạng phổ biến
 * nhất; dạng object thêm được đúng hai thứ mà chuỗi không mang nổi:
 *
 *   `href`   — mục này trỏ sang một trang khác (khóa `viet-bao-cao-khoa-hoc`).
 *   `points` — mục này có danh sách ý con, khi giáo trình gốc chia hai tầng.
 */
export type CourseSession =
  | string
  | { text: string; href?: string; points?: string[] };

export type CoursePhase = {
  name: string;
  /**
   * Câu chốt của cả module, in dưới danh sách. Chỉ có khi giáo trình gốc viết
   * ra nó ("Sau Module 1: học viên có thể…") — đây là kết quả học tập tác giả
   * cam kết, không phải câu tóm tắt do trang tự nghĩ ra.
   */
  summary?: string;
  sessions: CourseSession[];
};

/**
 * Nguồn sự thật duy nhất cho tập slug. `as const` ở đây mới là thứ giữ literal
 * — `satisfies Course[]` bên dưới không giữ, vì kiểu đích đã là `string`.
 */
export const COURSE_SLUGS = [
  "nckh-ung-dung-ai-xuat-ban-quoc-te",
  "training-tieu-luan-nckh-kltn",
  "nckh-chuyen-sau-spss",
  "spss-smartpls-ai",
  "kinh-te-luong-stata-ai",
  "viet-bai-tap-chi",
  "viet-bao-cao-khoa-hoc",
  "ung-dung-chatgpt-nckh",
] as const;

export type CourseSlug = (typeof COURSE_SLUGS)[number];

export type Course = {
  /** Stable, human-readable identifier. Never renumber when display order changes. */
  code: string;
  slug: CourseSlug;
  eyebrow: string;
  title: string;
  audience: string;
  /**
   * Cùng một câu `audience` nhưng tách theo từng nhóm người học, khi khóa phục
   * vụ nhiều nhóm khác nhau đủ để một dòng gộp trở nên vô nghĩa. Trang chi tiết
   * vẫn in `audience` khi trường này vắng mặt.
   */
  audienceProfiles?: { name: string; detail: string }[];
  intro: string;
  /**
   * How the curriculum is numbered, because the two shapes are not the same
   * thing and numbering them alike would misstate the course length.
   *
   * "sessions" — a phase groups several teaching sessions; they number
   *   continuously 1…n across the whole course ("Buổi 1" … "Buổi 8").
   * "modules"  — a phase IS one module taught in one session; the entries
   *   under it are topics, numbered 1.1, 1.2 … as the source numbers them.
   */
  curriculum: "sessions" | "modules";
  /**
   * `vnd` is the same figure as `amount`, as a number, so sorting never has to
   * parse the display string. Keep the two in step when a price changes.
   *
   * `deal` KHÔNG được thay `amount`/`vnd`, dù nó là con số hiển thị to hơn.
   * Đó là một mức giá CÓ ĐIỀU KIỆN, còn `vnd` là giá thật sẽ bị trừ tiền — nó
   * đi vào `offers.price` của schema.org (lib/structured-data.ts), vào việc sắp
   * xếp danh sách khóa (components/course-list.tsx) và vào giá dự phòng của giỏ
   * hàng (lib/cart.ts). Đặt giá ưu đãi vào đó là quảng cáo một mức giá mà người
   * mua lẻ không được hưởng.
   */
  price: {
    amount: string;
    note: string;
    noteLabel?: string;
    vnd: number;
    deal?: { amount: string; vnd: number; condition: string };
    /**
     * Khóa này có tham gia ưu đãi thanh toán nhóm không.
     *
     * Đánh dấu ở đây chứ không ở prisma/courses.json vì đây là một LỜI HỨA đã
     * in trên trang khóa học. `prisma/seed.ts` đọc trường này (và `deal.vnd`
     * nếu có) để nạp xuống database, nên giá được quảng cáo và giá thật sự bị
     * trừ chỉ có một nguồn duy nhất. Khóa không đặt trường này thì nhóm vẫn trả
     * giá lẻ — im lặng giảm giá một khóa không quảng cáo ưu đãi là cho đi tiền
     * mà không ai yêu cầu.
     */
    group?: true;
  };
  facts: { label: string; value: string }[];
  phases: CoursePhase[];
  outcomes: string[];
  instructor?: {
    name: string;
    credential: string;
    highlights: string[];
    links: { label: string; href: string }[];
  };
  registerNote: string;
};

/**
 * Registration is an account now, not a Google Form. Availability and the
 * authoritative price come from the Course row when the cart modal opens.
 */
const REGISTER_NOTE_GENERIC =
  "Đăng nhập, chọn khóa trong giỏ và thanh toán trực tiếp qua PayOS.";

/**
 * Cùng một giảng viên đứng ba khóa (AIQT, SPSS–SmartPLS, Stata), nên hồ sơ được
 * tách ra đây thay vì chép lại — sửa một chỗ là cả ba trang cập nhật.
 */
const INSTRUCTOR_TAM = {
  name: "Trịnh Công Tâm",
  credential: "Tiến sĩ",
  highlights: [
    "Thành viên Ban Biên tập của Eurasian Economic Review (xếp hạng C theo ABDC; ESCI Q1).",
    "Session Chair tại các hội thảo quốc tế EBES và AGBA.",
    "Active Reviewer cho các tạp chí quốc tế thuộc hệ thống Scopus và các tạp chí khoa học uy tín trong nước.",
    "Có công trình công bố trên các tạp chí SSCI Q1 và tạp chí xếp hạng A*, A theo ABDC Journal Quality List.",
    "Có kinh nghiệm nghiên cứu, phản biện và hỗ trợ phát triển nghiên cứu thực nghiệm trong kinh tế, kinh doanh và các lĩnh vực liên quan.",
  ],
  links: [
    { label: "Website", href: "https://congtamtrinh.com" },
    {
      label: "Google Scholar",
      href: "https://scholar.google.com.au/citations?user=-XIR3uYAAAAJ&hl=en&oi=ao",
    },
  ],
} satisfies NonNullable<Course["instructor"]>;

export const coursesIntro = {
  eyebrow: "Khóa học",
  title: "Phát triển năng lực nghiên cứu theo lộ trình",
  subtitle:
    "Từ kỹ năng viết học thuật nền tảng đến phương pháp nghiên cứu, phân tích dữ liệu, ứng dụng AI và công bố khoa học.",
  intro:
    "Các khóa học tại HDI được thiết kế theo lộ trình rõ ràng, kết hợp kiến thức cốt lõi với bài tập thực hành và các tình huống nghiên cứu thực tế. Người học có thể lựa chọn khóa học phù hợp với trình độ, mục tiêu và nhu cầu phát triển chuyên môn của mình.",
  guide:
    "Chọn một khóa học để xem nội dung, hình thức học và thông tin chi tiết.",
};

/**
 * ORDER — the currently promoted intake comes first, followed by the existing
 * learning path: foundations (tiểu luận/NCKH/KLTN) → SPSS & Stata gộp → hai khóa
 * chuyên biệt SPSS–SmartPLS và kinh tế lượng Stata → viết bài tạp chí → viết
 * luận văn/báo cáo khoa học → công cụ ChatGPT. Nothing reads a course by index
 * (cart, seed and lookups all go by slug).
 *
 * `COURSE_SLUGS` above defines the closed slug union. `satisfies Course[]`
 * checks every authored entry against that union without changing the inferred
 * shape of the rest of the course content.
 */
export const courses = [
  {
    code: "AIQT",
    slug: "nckh-ung-dung-ai-xuat-ban-quoc-te",
    eyebrow: "Khóa mới · Khai giảng 07/09/2026",
    title: "NGHIÊN CỨU KHOA HỌC ỨNG DỤNG AI & XUẤT BẢN QUỐC TẾ",
    audience:
      "Dành cho người đang thực hiện nghiên cứu và muốn ứng dụng AI có kiểm soát, chuẩn bị bài báo quốc tế hoặc phân tích dữ liệu bảng",
    intro:
      "Khóa học thực hành gồm 06 buổi, kết nối việc sử dụng ChatGPT trong nghiên cứu với quy trình xuất bản quốc tế, kiểm soát đạo văn/AI và các mô hình kinh tế lượng nâng cao thường dùng cho panel data.",
    curriculum: "modules",
    price: {
      amount: "3.000.000 đ",
      note: "Có recording, bộ prompts, dữ liệu và tài liệu thực hành",
      noteLabel: "Quyền lợi",
      vnd: 3000000,
    },
    facts: [
      { label: "Hình thức", value: "06 buổi trực tuyến qua Zoom" },
      { label: "Khai giảng", value: "07/09/2026" },
      { label: "Lịch học", value: "Lịch chi tiết sẽ được thông báo" },
      { label: "Sĩ số", value: "Tối đa 15 học viên/lớp" },
      { label: "Học liệu", value: "Recording và dữ liệu thực hành" },
    ],
    phases: [
      {
        name: "Buổi 1–2 | Ứng dụng ChatGPT trong nghiên cứu khoa học",
        sessions: [
          "Khai thác tiềm năng của ChatGPT trong nghiên cứu khoa học",
          "Sử dụng prompt chuẩn để hỗ trợ tìm kiếm và sàng lọc tài liệu",
          "Ứng dụng ChatGPT trong xây dựng và cải thiện Literature Review",
          "Xác định research gap và phát triển hướng nghiên cứu",
          "Hỗ trợ xây dựng lập luận và cấu trúc bài nghiên cứu",
          "Kiểm tra tính logic, tính nhất quán và cải thiện chất lượng bản thảo",
          "Sử dụng AI hiệu quả nhưng vẫn bảo đảm research integrity, hạn chế trích dẫn sai hoặc tài liệu không tồn tại",
          "Thực hành trực tiếp trên các tình huống nghiên cứu thực tế",
        ],
      },
      {
        name: "Buổi 3 | Kinh nghiệm xuất bản quốc tế",
        sessions: [
          "Tìm và đánh giá hội thảo quốc tế uy tín",
          "Lựa chọn journal phù hợp với đề tài và tránh tạp chí, hội thảo kém chất lượng",
          "Chuẩn bị manuscript, submission package và Cover Letter",
          "Thực hành quy trình submit bài trên hệ thống của journal",
          "Nhận diện những lỗi thường dẫn đến desk rejection",
          "Đọc, xử lý Reviewer Reports và viết Response to Reviewers chuyên nghiệp, thuyết phục",
          "Chỉnh sửa bài qua các vòng Major Revision và Minor Revision",
        ],
      },
      {
        name: "Buổi 4 | Kiểm tra đạo văn và AI",
        sessions: [
          "Phân biệt Similarity, Plagiarism và AI-generated content",
          "Đọc, phân tích Similarity Report và xác định các phần có nguy cơ bị đánh dấu cao",
          "Paraphrase và chỉnh sửa học thuật để giảm tỷ lệ tương đồng một cách hợp lệ",
          "Tự viết, kiểm chứng nguồn, chỉnh sửa và bổ sung đóng góp học thuật thực chất để giảm dấu hiệu văn bản do AI tạo ra",
          "Nhận diện những lỗi cần tránh khi sử dụng ChatGPT và AI trong nghiên cứu",
          {
            text: "Thực hành kiểm tra và cải thiện một bản thảo nghiên cứu",
            href: "/kiem-tra-ai-dao-van",
          },
        ],
      },
      {
        name: "Buổi 5–6 | Kinh tế lượng chuyên sâu với Panel Data",
        sessions: [
          "FGLS — Feasible Generalized Least Squares",
          "PMG — Pooled Mean Group",
          "IV/2SLS — Instrumental Variables/Two-Stage Least Squares",
          "System GMM — System Generalized Method of Moments",
          "Xác định và xử lý cross-sectional dependence",
          "Nhận diện endogeneity và lựa chọn biến công cụ",
          "Thực hiện các kiểm định cần thiết trước và sau ước lượng",
          "Đọc, giải thích và trình bày kết quả theo chuẩn bài báo quốc tế",
          "Thực hành trực tiếp với dữ liệu nghiên cứu được cung cấp trong khóa học",
        ],
      },
    ],
    outcomes: [
      "Sử dụng ChatGPT và prompt học thuật có kiểm soát, biết kiểm chứng nguồn và bảo đảm liêm chính nghiên cứu.",
      "Xây dựng Literature Review, xác định research gap và cải thiện lập luận, cấu trúc bản thảo.",
      "Chuẩn bị submission package, xử lý phản biện và sửa bài qua các vòng review quốc tế.",
      "Đọc Similarity Report và cải thiện bản thảo bằng đóng góp học thuật thực chất.",
      "Lựa chọn, ước lượng và trình bày FGLS, PMG, IV/2SLS hoặc System GMM phù hợp với vấn đề panel data.",
    ],
    instructor: INSTRUCTOR_TAM,
    registerNote: REGISTER_NOTE_GENERIC,
  },

  {
    code: "TIEULUAN",
    slug: "training-tieu-luan-nckh-kltn",
    eyebrow: "Khóa nền tảng · Khai giảng 01/10/2026",
    title: "Viết tiểu luận, Nghiên cứu khoa học & Khóa luận tốt nghiệp",
    audience:
      "Dành cho sinh viên năm 1–4 và người mới bắt đầu nghiên cứu",
    audienceProfiles: [
      {
        name: "Năm 1–2 · Xây nền tảng",
        detail:
          "Bạn đang làm assignment, essay hoặc report và chưa biết cách tìm tài liệu, trích dẫn và viết một bài học thuật đúng chuẩn.",
      },
      {
        name: "Năm 2–3 · Bắt đầu nghiên cứu",
        detail:
          "Bạn muốn tham gia NCKH sinh viên, xây dựng đề tài, Literature Review, bảng hỏi hoặc bắt đầu làm việc với dữ liệu.",
      },
      {
        name: "Năm 3–4 · Chuẩn bị khóa luận",
        detail:
          "Bạn cần hệ thống lại toàn bộ quy trình nghiên cứu, từ câu hỏi nghiên cứu, phương pháp, dữ liệu đến viết và hoàn thiện khóa luận.",
      },
      {
        name: "Người muốn đi xa hơn",
        detail:
          "Bạn muốn xây dựng nền tảng để tiếp tục học SPSS/Stata, thực hiện dự án nghiên cứu hoặc từng bước phát triển nghiên cứu thành bài báo khoa học.",
      },
    ],
    intro:
      "Khóa học 3 buổi đi qua toàn bộ quy trình từ chọn chủ đề, tìm và đọc tài liệu, xây dựng lập luận, viết học thuật, làm việc với dữ liệu đến trích dẫn và hoàn thiện bài. AI được tích hợp xuyên suốt như một trợ lý nghiên cứu, giúp học viên làm việc hiệu quả hơn nhưng vẫn đảm bảo tư duy độc lập và liêm chính học thuật.",
    curriculum: "modules",
    price: {
      amount: "300.000 đ",
      note: "Đăng ký nhóm từ 03 người: 250.000 đ mỗi người",
      vnd: 300000,
      group: true,
      // Đây là giá thật sự bị trừ khi nhóm đủ 3 người: prisma/seed.ts nạp
      // `deal.vnd` xuống cột courses.group_price_vnd, và lib/group-pricing.ts
      // đọc cột đó. Sửa con số ở đây thì phải chạy lại seed.
      deal: {
        amount: "250.000 đ",
        vnd: 250000,
        condition: "mỗi người · nhóm từ 03 bạn",
      },
    },
    facts: [
      { label: "Khai giảng", value: "01/10/2026" },
      { label: "Lớp trực tiếp", value: "03 buổi Zoom + học liệu online" },
      { label: "Sĩ số", value: "Tối đa 15 học viên/lớp" },
      { label: "Xem lại", value: "03 năm kể từ ngày đăng ký" },
    ],
    phases: [
      {
        name: "Từ đề bài đến ý tưởng nghiên cứu",
        summary:
          "Sau Module 1: học viên đi được từ một đề bài hoặc chủ đề ban đầu đến đề tài, câu hỏi nghiên cứu, tài liệu nền và outline hoàn chỉnh.",
        sessions: [
          {
            text: "Hiểu đúng yêu cầu của một bài học thuật",
            points: [
              "Phân biệt essay, report, research proposal, NCKH và khóa luận tốt nghiệp",
              "Đọc đề bài, rubric và xác định yêu cầu trọng tâm",
              "Những lỗi khiến sinh viên mất điểm ngay từ khi chọn hướng viết",
            ],
          },
          {
            text: "Từ chủ đề đến câu hỏi nghiên cứu",
            points: [
              "Cách tìm và thu hẹp chủ đề",
              "Đặt tên đề tài phù hợp",
              "Xác định vấn đề và khoảng trống nghiên cứu ở mức cơ bản",
              "Xây dựng research question, objectives và hướng nghiên cứu",
            ],
          },
          {
            text: "Tìm tài liệu học thuật đáng tin cậy",
            points: [
              "Google Scholar, Scopus và các nguồn học thuật",
              "Phân biệt paper học thuật với nguồn Internet thông thường",
              "Cách chọn tài liệu phù hợp thay vì tải thật nhiều tài liệu",
            ],
          },
          {
            text: "Đọc paper nhanh và có mục đích",
            points: [
              "Cấu trúc một bài báo khoa học",
              "Đọc Abstract – Introduction – Literature – Method – Results – Conclusion",
              "Cách lấy đúng thông tin cần thiết từ paper",
            ],
          },
          {
            text: "AI hỗ trợ tìm và đọc tài liệu",
            points: [
              "ChatGPT, Consensus, NotebookLM, Connected Papers",
              "Dùng AI để giải thích paper và hệ thống hóa tài liệu",
              "Cách kiểm tra nguồn để tránh citation và reference không có thật",
            ],
          },
          {
            text: "Xây dựng “bộ khung” bài trước khi viết",
            points: [
              "Từ research question đến outline",
              "Logic giữa các section",
              "Thực hành xây dựng outline cho một đề tài thực tế",
            ],
          },
        ],
      },
      {
        name: "Từ tài liệu đến bài viết học thuật",
        summary:
          "Sau Module 2: học viên hiểu toàn bộ logic của một nghiên cứu và viết được các phần chính của tiểu luận, NCKH hoặc khóa luận, thay vì chỉ biết định dạng bài.",
        sessions: [
          {
            text: "Công thức viết một đoạn văn học thuật",
            points: [
              "Topic sentence – Evidence – Analysis – Link",
              "Viết có lập luận thay vì mô tả",
              "Cách kết nối các đoạn thành một câu chuyện thống nhất",
            ],
          },
          {
            text: "Viết Introduction / Đặt vấn đề",
            points: [
              "Background",
              "Research problem",
              "Research gap",
              "Objectives và contribution",
              "Khác biệt giữa phần mở đầu của tiểu luận và nghiên cứu khoa học",
            ],
          },
          {
            text: "Literature Review từ cơ bản đến NCKH",
            points: [
              "Literature Review không phải là “kể lại từng paper”",
              "Nhóm nghiên cứu theo chủ đề",
              "So sánh, tổng hợp và phản biện tài liệu",
              "Literature Review Table",
              "Từ literature đến framework/hypotheses ở mức nhập môn",
            ],
          },
          {
            text: "Dữ liệu và phương pháp nghiên cứu dành cho người mới",
            points: [
              "Khi nào cần dữ liệu?",
              "Primary vs. secondary data",
              "Định tính vs. định lượng",
              "Thiết kế bảng hỏi cơ bản",
              "Biến số, thang đo và mẫu nghiên cứu",
              "Hiểu đơn giản về descriptive statistics, correlation và regression",
            ],
          },
          {
            text: "Đọc bảng, biểu đồ và kết quả định lượng",
            points: [
              "Không chỉ “đọc lại con số”",
              "Xác định kết quả quan trọng",
              "Diễn giải ý nghĩa kinh tế/quản trị",
              "Từ kết quả đến Discussion",
            ],
          },
          {
            text: "Viết Discussion & Conclusion",
            points: [
              "Trả lời research question bằng kết quả",
              "So sánh với nghiên cứu trước",
              "Implications",
              "Limitations và future research",
              "Cách kết thúc bài ngắn gọn nhưng có giá trị",
            ],
          },
          {
            text: "AI như một Research Assistant",
            points: [
              "Brainstorm nhưng không để AI quyết định nội dung nghiên cứu",
              "Hỗ trợ outline và kiểm tra logic",
              "Hỗ trợ đọc, so sánh và tổng hợp paper",
              "Hỗ trợ giải thích kết quả thống kê",
              "Kiểm tra và cải thiện academic writing",
              "Nguyên tắc Human → AI → Verify → Rewrite",
            ],
          },
        ],
      },
      {
        name: "Hoàn thiện bài & bước vào con đường nghiên cứu",
        summary:
          "Sau Module 3: học viên không chỉ hoàn thành được bài hiện tại mà còn biết mình đang ở đâu trên hành trình nghiên cứu và bước tiếp theo cần học gì.",
        sessions: [
          {
            text: "Citation & Reference",
            points: [
              "Khi nào bắt buộc phải trích dẫn?",
              "In-text citation và reference list",
              "APA/Harvard ở mức thực hành",
              "Trích dẫn bảng, hình và dữ liệu",
            ],
          },
          {
            text: "EndNote và quản lý tài liệu",
            points: [
              "Import tài liệu",
              "Cite While You Write",
              "Tạo reference list tự động",
              "Kiểm tra reference thiếu/thừa",
            ],
          },
          {
            text: "Word dành cho bài học thuật",
            points: [
              "Heading",
              "Table of Contents tự động",
              "Section Break",
              "Page numbering",
              "Tables/Figures",
              "Những thao tác cần thiết cho tiểu luận và khóa luận tốt nghiệp",
            ],
          },
          {
            text: "Đạo văn, similarity và sử dụng AI có trách nhiệm",
            points: [
              "Similarity ≠ plagiarism",
              "Vì sao Turnitin đánh dấu similarity",
              "Paraphrase đúng cách",
              "Citation đúng nhưng vẫn có thể similarity cao",
              "AI-generated text và các rủi ro học thuật",
              "Không sử dụng AI để tạo nguồn hoặc dữ liệu giả",
            ],
          },
          {
            text: "Quy trình kiểm tra bài trước khi nộp",
            points: [
              "Topic → Structure → Evidence → Analysis → Citation → Format → Language → Final check",
              "Thực hành audit một bài thực tế để nhận diện lỗi cấu trúc và lỗi lập luận",
              "Nhận diện lỗi citation và lỗi reference",
              "Nhận diện lỗi trình bày và lỗi sử dụng AI",
            ],
          },
          {
            text: "Từ bài tiểu luận đến nghiên cứu khoa học",
            points: [
              "Một bài assignment tốt có thể phát triển thành NCKH như thế nào?",
              "Từ NCKH sinh viên đến khóa luận",
              "Từ khóa luận đến working paper hoặc bài báo",
              "Khi nào nên học SPSS/Stata?",
              "Khi nào cần Research Coaching/Mentoring?",
            ],
          },
          {
            text: "Xây dựng Research Roadmap cá nhân",
            points: [
              "Năm 1: Tiểu luận → Academic Writing → Citation → AI literacy",
              "Năm 2: Tiểu luận nâng cao → Literature Review → Data basics",
              "Năm 3: NCKH → SPSS/Stata → Research Project",
              "Năm 4: Khóa luận → Research Mentoring → Publication pathway",
            ],
          },
        ],
      },
    ],
    outcomes: [
      "Đi từ một đề bài ban đầu đến đề tài, câu hỏi nghiên cứu, tài liệu nền và outline hoàn chỉnh.",
      "Viết được các phần chính của tiểu luận, NCKH và khóa luận: Introduction, Literature Review, phương pháp, kết quả, Discussion và Conclusion.",
      "Trích dẫn đúng chuẩn APA/Harvard, quản lý tài liệu bằng EndNote và định dạng bài trên Word đúng yêu cầu.",
      "Phân biệt similarity với đạo văn, paraphrase đúng cách và sử dụng AI theo nguyên tắc Human → AI → Verify → Rewrite.",
      "Có một Research Roadmap cá nhân theo từng năm học, biết bước tiếp theo cần học gì.",
    ],
    registerNote: REGISTER_NOTE_GENERIC,
  },

  {
    code: "SPSS",
    slug: "nckh-chuyen-sau-spss",
    eyebrow: "Khóa chuyên sâu · 06 buổi thực hành",
    title: "Phân tích dữ liệu nghiên cứu với SPSS & Stata — thực chiến",
    audience:
      "Dành cho sinh viên, học viên cao học, nghiên cứu sinh và giảng viên đang thực hiện đề tài trong khoa học xã hội, kinh tế, tài chính và quản trị",
    intro:
      "Khóa học kết hợp SPSS và Stata theo một quy trình nghiên cứu hoàn chỉnh: từ thiết kế mô hình, chuẩn bị dữ liệu, phân tích khảo sát đến hồi quy, dữ liệu bảng và các kỹ thuật kinh tế lượng nâng cao. Mỗi buổi đều gắn với dữ liệu thực hành và cách đọc, trình bày kết quả trong bài nghiên cứu.",
    curriculum: "sessions",
    price: {
      amount: "1.100.000 đ",
      note: "Giảm 10% cho nhóm từ 03 người",
      group: true,
      vnd: 1100000,
    },
    facts: [
      { label: "Lớp trực tiếp", value: "06 buổi qua Zoom" },
      { label: "Học liệu", value: "Recording và bộ dữ liệu thực hành" },
      { label: "Xem lại", value: "02 năm kể từ ngày đăng ký" },
    ],
    phases: [
      {
        name: "Nền tảng nghiên cứu và dữ liệu",
        sessions: [
          {
            text: "Thiết kế nghiên cứu và lựa chọn SPSS/Stata",
            points: [
              "Xác định câu hỏi nghiên cứu, biến nghiên cứu và mô hình phân tích",
              "Phân biệt dữ liệu khảo sát, dữ liệu cắt ngang, chuỗi thời gian và dữ liệu bảng",
              "Chọn SPSS hay Stata theo mục tiêu, loại dữ liệu và kỹ thuật cần sử dụng",
              "Chuẩn bị codebook, quy ước biến và kế hoạch phân tích",
            ],
          },
          {
            text: "Nhập, mã hóa, làm sạch dữ liệu và thống kê mô tả",
            points: [
              "Nhập dữ liệu, mã hóa biến và kiểm tra cấu trúc bộ dữ liệu",
              "Xử lý giá trị thiếu, quan sát bất thường và ngoại lệ",
              "Thực hiện thống kê mô tả, bảng tần số và trực quan hóa cơ bản",
              "Thiết lập quy trình syntax/do-file có thể kiểm tra và lặp lại",
            ],
          },
        ],
      },
      {
        name: "Phân tích khảo sát và hồi quy với SPSS",
        sessions: [
          {
            text: "Cronbach’s Alpha, EFA và kiểm tra thang đo trên SPSS",
            points: [
              "Đánh giá độ tin cậy thang đo bằng Cronbach’s Alpha",
              "Thực hiện EFA và kiểm tra KMO, Bartlett, factor loading và tổng phương sai trích",
              "Phát hiện biến không phù hợp và tạo biến đại diện cho mô hình",
              "Đọc output, lập bảng kết quả và viết diễn giải học thuật",
            ],
          },
          {
            text: "Tương quan, OLS và Logistic Regression",
            points: [
              "Phân tích tương quan và chuẩn bị biến cho mô hình hồi quy",
              "Ước lượng OLS, đọc hệ số, mức ý nghĩa, R² và kiểm định mô hình",
              "Kiểm tra đa cộng tuyến, phương sai thay đổi và các vấn đề thường gặp",
              "Ứng dụng Binary Logistic Regression và trình bày kết quả đúng ngữ cảnh",
            ],
          },
        ],
      },
      {
        name: "Kinh tế lượng ứng dụng và hoàn thiện nghiên cứu với Stata",
        sessions: [
          {
            text: "Stata workflow và dữ liệu bảng",
            points: [
              "Làm quen với do-file, log-file, quản lý dữ liệu và quy trình phân tích trên Stata",
              "Thiết lập panel data bằng xtset; thực hiện FE, RE và kiểm định Hausman",
              "Kiểm tra tự tương quan, phương sai thay đổi, phụ thuộc chéo và sử dụng robust SE/FGLS",
              "So sánh output, lựa chọn mô hình và giải thích kết quả theo câu hỏi nghiên cứu",
            ],
          },
          {
            text: "IV/2SLS, GMM/PMG và mini-project",
            points: [
              "Nhận diện nội sinh và thực hành IV/2SLS khi OLS không còn phù hợp",
              "Giới thiệu GMM động và PMG trong các bài toán dữ liệu bảng nâng cao",
              "Hoàn thiện mini-project từ dữ liệu, lệnh phân tích đến bảng kết quả",
              "Trình bày, diễn giải và viết phần kết quả/thảo luận cho luận văn hoặc bài báo",
            ],
          },
        ],
      },
    ],
    outcomes: [
      "Thiết kế được kế hoạch phân tích phù hợp với câu hỏi nghiên cứu, loại dữ liệu và mô hình đề xuất.",
      "Chuẩn bị, mã hóa, làm sạch và mô tả dữ liệu bằng quy trình có thể kiểm tra và lặp lại.",
      "Thực hiện và diễn giải Cronbach’s Alpha, EFA, tương quan, OLS và Logistic Regression trên SPSS.",
      "Thực hiện workflow trên Stata cho dữ liệu bảng, FE/RE, Hausman, robust SE, FGLS và các kỹ thuật nâng cao phù hợp.",
      "Hoàn thiện bảng kết quả và phần diễn giải học thuật từ một mini-project nghiên cứu thực tế.",
    ],
    registerNote: REGISTER_NOTE_GENERIC,
  },

  {
    code: "SMARTPLS",
    slug: "spss-smartpls-ai",
    eyebrow: "Khóa chuyên sâu · 06 module thực hành",
    title: "Thiết kế nghiên cứu và phân tích dữ liệu với SPSS, SmartPLS & AI",
    audience:
      "Dành cho sinh viên đại học, học viên cao học và người đang thực hiện nghiên cứu định lượng",
    intro:
      "Khóa học cung cấp quy trình thực hành toàn diện, từ xác định vấn đề, xây dựng mô hình, thiết kế bảng hỏi đến xử lý, phân tích và trình bày dữ liệu bằng SPSS và SmartPLS. AI được tích hợp có kiểm soát vào từng giai đoạn để hỗ trợ phát triển ý tưởng, kiểm tra tính logic, xử lý dữ liệu, giải thích kết quả và cải thiện cách trình bày; học viên đồng thời được hướng dẫn kiểm chứng thông tin, bảo vệ dữ liệu và sử dụng AI phù hợp với chuẩn mực liêm chính học thuật.",
    curriculum: "modules",
    price: {
      amount: "1.000.000 đ",
      note: "Giảm 10% cho nhóm từ 03 người",
      group: true,
      vnd: 1000000,
    },
    facts: [
      { label: "Hình thức", value: "Lý thuyết cô đọng kết hợp thực hành" },
      { label: "Nội dung", value: "06 module, có buổi Research Clinic góp ý đề tài" },
      { label: "Học liệu", value: "Recording và bộ dữ liệu thực hành" },
      { label: "Xem lại", value: "02 năm kể từ ngày đăng ký" },
    ],
    phases: [
      {
        name: "Thiết kế nghiên cứu và xây dựng mô hình",
        summary:
          "Sản phẩm: câu hỏi, mục tiêu, mô hình, giả thuyết và kế hoạch phân tích sơ bộ.",
        sessions: [
          "Xác định vấn đề và khoảng trống nghiên cứu",
          "Xây dựng câu hỏi và mục tiêu nghiên cứu",
          "Phân biệt nghiên cứu khám phá, mô tả, giải thích và dự báo",
          "Lựa chọn phương pháp định tính, định lượng hoặc hỗn hợp",
          "Xác định biến độc lập, phụ thuộc, trung gian, điều tiết và kiểm soát",
          "Lựa chọn lý thuyết nền và xây dựng khung lý thuyết",
          "Xây dựng mô hình và giả thuyết nghiên cứu",
          "Lập kế hoạch thu thập và phân tích dữ liệu",
          "Ứng dụng AI để phát triển câu hỏi, kiểm tra tính logic của mô hình và đề xuất từ khóa tìm kiếm",
          "Thực hành xây dựng mô hình và kế hoạch phân tích cho một đề tài cụ thể",
        ],
      },
      {
        name: "Thiết kế thang đo, bảng hỏi và chuẩn bị dữ liệu",
        summary:
          "Sản phẩm: bảng hỏi, codebook và file dữ liệu SPSS đã được làm sạch.",
        sessions: [
          "Phân biệt khái niệm nghiên cứu, biến quan sát và biến tiềm ẩn",
          "Các loại thang đo và nguyên tắc mã hóa dữ liệu",
          "Tìm kiếm, lựa chọn và điều chỉnh thang đo từ nghiên cứu trước",
          "Thiết kế cấu trúc và nội dung bảng hỏi khoa học",
          "Dịch thuật, hiệu chỉnh thang đo và thực hiện pilot test",
          "Xác định tổng thể, phương pháp chọn mẫu và cỡ mẫu",
          "Khởi tạo, đặt tên, mã hóa và gắn nhãn biến trên SPSS",
          "Phát hiện và xử lý dữ liệu thiếu, ngoại lệ, biến đảo chiều và câu trả lời thiếu tin cậy",
          "Ứng dụng AI để rà soát bảng hỏi, hỗ trợ xây dựng codebook và SPSS Syntax cơ bản",
          "Thực hành thiết kế bảng hỏi và làm sạch bộ dữ liệu khảo sát",
        ],
      },
      {
        name: "Thống kê mô tả, kiểm định khác biệt và EFA trên SPSS",
        summary:
          "Sản phẩm: bảng thống kê mô tả, kiểm định khác biệt, Cronbach’s Alpha, EFA và phần diễn giải.",
        sessions: [
          "Thống kê mô tả đặc điểm mẫu và các biến nghiên cứu",
          "Lựa chọn kỹ thuật kiểm định theo câu hỏi nghiên cứu và loại dữ liệu",
          "Kiểm định sự khác biệt giữa hai nhóm bằng Independent-samples t-test",
          "Kiểm định sự khác biệt giữa nhiều nhóm bằng One-way ANOVA",
          "Đánh giá độ tin cậy thang đo bằng Cronbach’s Alpha và tương quan biến–tổng",
          "Phân biệt Principal Component Analysis và Exploratory Factor Analysis",
          "Đánh giá KMO, Bartlett’s Test, factor loading và tổng phương sai trích",
          "Lựa chọn phép xoay, xác định số nhân tố và tạo biến đại diện",
          "Ứng dụng AI để đọc output, kiểm tra lựa chọn phương pháp và hỗ trợ diễn giải kết quả",
          "Thực hành phân tích và trình bày bảng kết quả theo chuẩn khóa luận, luận văn",
        ],
      },
      {
        name: "Phân tích hồi quy trên SPSS",
        summary:
          "Sản phẩm: mô hình hồi quy, kết quả kiểm tra giả định, bảng kiểm định giả thuyết và phần diễn giải.",
        sessions: [
          "Phân tích tương quan và lựa chọn mô hình hồi quy phù hợp",
          "Thực hiện hồi quy tuyến tính OLS đơn biến và đa biến",
          "Đưa biến kiểm soát, biến giả và biến tương tác vào mô hình",
          "Kiểm tra đa cộng tuyến bằng VIF và Tolerance",
          "Kiểm tra tính tuyến tính, phần dư, phương sai sai số và quan sát ảnh hưởng",
          "Diễn giải R², Adjusted R², F-test, hệ số hồi quy và p-value",
          "Phân biệt ý nghĩa thống kê và ý nghĩa thực tiễn của kết quả",
          "Thực hiện Binary Logistic Regression và diễn giải odds ratio",
          "Ứng dụng AI để hỗ trợ đọc output, kiểm tra giả định và phát hiện kết luận chưa phù hợp",
          "Thực hành lập bảng, kiểm định giả thuyết và viết phần kết quả hồi quy",
        ],
      },
      {
        name: "Phân tích dữ liệu với SmartPLS",
        summary:
          "Sản phẩm: mô hình SmartPLS, bảng đánh giá thang đo, kết quả kiểm định giả thuyết và phần diễn giải.",
        sessions: [
          "Xác định trường hợp phù hợp và những lưu ý khi sử dụng SmartPLS",
          "Chuẩn bị, kiểm tra và nhập dữ liệu vào SmartPLS",
          "Khởi tạo dự án và xây dựng mô hình nghiên cứu trên phần mềm",
          "Chạy mô hình và đánh giá outer loading của các biến quan sát",
          "Đánh giá độ tin cậy bằng Cronbach’s Alpha, rho_A và Composite Reliability",
          "Đánh giá giá trị hội tụ bằng AVE và giá trị phân biệt bằng HTMT",
          "Kiểm tra VIF, path coefficient, R² và f²",
          "Chạy bootstrapping, kiểm định giả thuyết và phân tích tác động trực tiếp, gián tiếp",
          "Ứng dụng AI để đọc kết quả, lập bảng kiểm định và kiểm tra sự thống nhất trong diễn giải",
          "Thực hành toàn bộ quy trình SmartPLS và giới thiệu phân tích trung gian, điều tiết",
        ],
      },
      {
        name: "AI-Assisted Research Clinic – thảo luận và góp ý đề tài",
        summary:
          "Sản phẩm: phiếu góp ý, danh mục điều chỉnh và kế hoạch hành động dành riêng cho từng học viên.",
        sessions: [
          "Học viên trình bày đề tài, tiến độ và những khó khăn hiện tại",
          "Góp ý tên đề tài, vấn đề, câu hỏi và mục tiêu nghiên cứu",
          "Đánh giá cơ sở lý thuyết, mô hình và giả thuyết nghiên cứu",
          "Góp ý thang đo, bảng hỏi và phương pháp thu thập dữ liệu",
          "Tư vấn đối tượng khảo sát, phương pháp chọn mẫu và cỡ mẫu",
          "Lựa chọn kỹ thuật phân tích phù hợp với câu hỏi và đặc điểm dữ liệu",
          "Xác định phạm vi sử dụng SPSS, hồi quy hoặc SmartPLS",
          "Góp ý dữ liệu, kết quả phân tích và cách diễn giải hiện có",
          "Ứng dụng AI để rà soát tính nhất quán và xây dựng danh mục nội dung cần chỉnh sửa",
          "Đề xuất hướng nghiên cứu và lập kế hoạch triển khai tiếp theo cho từng đề tài",
        ],
      },
    ],
    outcomes: [
      "Xây dựng được câu hỏi, mục tiêu, mô hình và giả thuyết nghiên cứu kèm kế hoạch phân tích phù hợp.",
      "Thiết kế thang đo, bảng hỏi khoa học và làm sạch bộ dữ liệu khảo sát trên SPSS.",
      "Thực hiện và diễn giải thống kê mô tả, Independent-samples t-test, One-way ANOVA, Cronbach’s Alpha và EFA.",
      "Chạy và kiểm định hồi quy OLS đơn biến, đa biến và Binary Logistic Regression với đầy đủ kiểm tra giả định.",
      "Thực hiện quy trình SmartPLS: đánh giá mô hình đo lường, mô hình cấu trúc, bootstrapping và phân tích trung gian, điều tiết.",
      "Trình bày bảng kết quả và phần diễn giải theo chuẩn khóa luận, luận văn; dùng AI hỗ trợ nhưng vẫn kiểm chứng kết quả.",
    ],
    instructor: INSTRUCTOR_TAM,
    registerNote: REGISTER_NOTE_GENERIC,
  },

  {
    code: "STATA",
    slug: "kinh-te-luong-stata-ai",
    eyebrow: "Khóa chuyên sâu · 05 buổi",
    title: "Kinh tế lượng ứng dụng với Stata & AI",
    audience:
      "Dành cho người đã có kiến thức thống kê hoặc hồi quy cơ bản và muốn học kinh tế lượng ứng dụng trên Stata",
    audienceProfiles: [
      {
        name: "Sinh viên năm 3–4",
        detail:
          "Đang thực hiện nghiên cứu khoa học hoặc khóa luận tốt nghiệp.",
      },
      {
        name: "Học viên cao học & nghiên cứu sinh",
        detail: "Sử dụng dữ liệu định lượng trong luận văn, luận án.",
      },
      {
        name: "Giảng viên",
        detail:
          "Thuộc các ngành kinh tế, tài chính, kinh doanh và quản lý.",
      },
      {
        name: "Chuyên viên phân tích",
        detail:
          "Phân tích dữ liệu, nghiên cứu thị trường và phân tích chính sách.",
      },
      {
        name: "Người đã có nền tảng",
        detail:
          "Đã có kiến thức thống kê hoặc hồi quy cơ bản và muốn học kinh tế lượng ứng dụng trên Stata một cách bài bản.",
      },
    ],
    intro:
      "Khóa học hướng dẫn xây dựng và thực hiện một quy trình nghiên cứu kinh tế lượng hoàn chỉnh bằng Stata, từ tổ chức dữ liệu, lựa chọn mô hình, kiểm định các vấn đề kỹ thuật đến ước lượng và trình bày kết quả. Nội dung tập trung vào OLS, FE/RE, FGLS, IV/2SLS, GMM và Panel ARDL–PMG tuyến tính, phi tuyến; AI được tích hợp có kiểm soát để hỗ trợ viết lệnh, phát hiện lỗi, giải thích kết quả và rà soát tính nhất quán của nghiên cứu.",
    curriculum: "modules",
    price: {
      amount: "1.000.000 đ",
      note: "Giảm 10% cho nhóm từ 03 người",
      group: true,
      vnd: 1000000,
    },
    facts: [
      { label: "Thời lượng", value: "05 buổi" },
      {
        label: "Hình thức",
        value: "Lý thuyết cô đọng kết hợp thực hành trên dữ liệu thực tế",
      },
      { label: "Nội dung", value: "05 module, có buổi Research Clinic góp ý đề tài" },
      { label: "Học liệu", value: "Recording, do-file và bộ dữ liệu thực hành" },
      { label: "Xem lại", value: "02 năm kể từ ngày đăng ký" },
    ],
    phases: [
      {
        name: "Quy trình nghiên cứu kinh tế lượng và nền tảng Stata",
        summary:
          "Sản phẩm: do-file có cấu trúc, dữ liệu sạch, bảng thống kê mô tả và kết quả OLS.",
        sessions: [
          "Xây dựng câu hỏi, giả thuyết và mô hình kinh tế lượng từ vấn đề nghiên cứu",
          "Phân biệt dữ liệu cắt ngang, chuỗi thời gian và dữ liệu bảng",
          "Lựa chọn biến phụ thuộc, biến giải thích, biến kiểm soát và dạng hàm",
          "Làm quen với giao diện, command, do-file, log-file và help trong Stata",
          "Nhập, nối, chuyển đổi và tổ chức dữ liệu nghiên cứu",
          "Làm sạch dữ liệu, xử lý dữ liệu thiếu, ngoại lệ và mã hóa biến",
          "Thống kê mô tả, tương quan và trực quan hóa dữ liệu",
          "Ước lượng OLS; đọc hệ số, sai số chuẩn, p-value, khoảng tin cậy và R²",
          "Ứng dụng AI để xây dựng do-file, giải thích câu lệnh và phát hiện lỗi lập trình",
          "Thực hành quy trình từ dữ liệu thô đến mô hình OLS và xuất bảng kết quả",
        ],
      },
      {
        name: "Phân tích dữ liệu bảng và xử lý các vấn đề mô hình",
        summary:
          "Sản phẩm: bảng so sánh Pooled OLS, FE, RE và mô hình hiệu chỉnh phù hợp.",
        sessions: [
          "Cấu trúc dữ liệu bảng, nhận diện panel cân bằng và không cân bằng",
          "Khai báo, kiểm tra và tổ chức dữ liệu bảng bằng xtset",
          "Ước lượng Pooled OLS, Fixed Effects và Random Effects",
          "Lựa chọn mô hình bằng F-test, Breusch–Pagan LM và Hausman test",
          "Phát hiện đa cộng tuyến và đánh giá VIF",
          "Kiểm định phương sai sai số thay đổi và tự tương quan trong dữ liệu bảng",
          "Kiểm định phụ thuộc chéo giữa các đơn vị bảng",
          "Lựa chọn robust/clustered standard errors, Driscoll–Kraay và FGLS phù hợp",
          "Ứng dụng AI để xây dựng chuỗi kiểm định và so sánh các phương án xử lý mô hình",
          "Thực hành lựa chọn estimator, kiểm tra độ vững và trình bày kết quả panel",
        ],
      },
      {
        name: "Nội sinh, biến công cụ và GMM động",
        summary:
          "Sản phẩm: mô hình IV/2SLS hoặc GMM, kết quả kiểm định công cụ và đoạn diễn giải học thuật.",
        sessions: [
          "Nhận diện nội sinh do biến bỏ sót, quan hệ đồng thời, sai số đo lường và quan hệ động",
          "Phân biệt tương quan, quan hệ nhân quả và vấn đề nhận dạng mô hình",
          "Điều kiện relevance và exogeneity của biến công cụ",
          "Ước lượng IV/2SLS và so sánh với OLS",
          "Kiểm định nội sinh, công cụ yếu và các hạn chế quá xác định",
          "Xây dựng mô hình dữ liệu bảng động",
          "Phân biệt Difference GMM và System GMM",
          "Kiểm soát số lượng công cụ; diễn giải Hansen test, AR(1) và AR(2)",
          "Ứng dụng AI để rà soát đặc tả mô hình, giải thích kiểm định và phát hiện kết luận nhân quả quá mức",
          "Thực hành IV/2SLS hoặc System GMM và lập bảng kiểm tra độ tin cậy của mô hình",
        ],
      },
      {
        name: "Linear và Nonlinear Panel ARDL–PMG",
        summary:
          "Sản phẩm: hai mô hình Linear và Nonlinear PMG, bảng kết quả ngắn hạn–dài hạn và kiểm định bất đối xứng.",
        sessions: [
          "Nhận diện dữ liệu bảng động và điều kiện sử dụng Panel ARDL–PMG",
          "Kiểm định phụ thuộc chéo và lựa chọn thế hệ kiểm định nghiệm đơn vị phù hợp",
          "Kiểm định tính dừng và bảo đảm không có biến tích hợp bậc hai, I(2)",
          "Xây dựng Panel ARDL và lựa chọn cấu trúc độ trễ",
          "Phân biệt Mean Group, Dynamic Fixed Effects và Pooled Mean Group",
          "Ước lượng Linear PMG; diễn giải quan hệ dài hạn, ngắn hạn và hệ số hiệu chỉnh sai số",
          "Kiểm định lựa chọn giữa PMG, MG và DFE; thực hiện các kiểm tra độ vững",
          "Xây dựng Nonlinear PMG bằng phân rã biến thành các thay đổi dương và âm; kiểm định bất đối xứng",
          "Ứng dụng AI để hỗ trợ viết lệnh, rà soát kết quả và diễn giải tác động tuyến tính, bất đối xứng",
          "Thực hành so sánh Linear PMG và Nonlinear PMG trên dữ liệu bảng thực tế",
        ],
      },
      {
        name: "Ôn tập và Research Clinic – góp ý đề tài học viên",
        summary:
          "Sản phẩm: phiếu góp ý, mô hình đề xuất, danh mục kiểm định và kế hoạch hành động riêng cho từng học viên.",
        sessions: [
          "Hệ thống hóa quy trình từ câu hỏi nghiên cứu đến lựa chọn estimator",
          "Ôn tập OLS, FE/RE, FGLS, IV/2SLS, GMM và Panel ARDL–PMG",
          "Học viên trình bày đề tài, dữ liệu, mô hình và tiến độ hiện tại",
          "Góp ý câu hỏi, giả thuyết và đặc tả mô hình kinh tế lượng",
          "Đánh giá cấu trúc dữ liệu, biến số, nguồn dữ liệu và thời gian nghiên cứu",
          "Tư vấn lựa chọn estimator và hệ thống kiểm định phù hợp",
          "Góp ý do-file, kết quả ước lượng và các kiểm tra độ vững",
          "Rà soát cách lập bảng, diễn giải kết quả và mức độ phù hợp của kết luận",
          "Ứng dụng AI để kiểm tra do-file, tổng hợp góp ý và xây dựng danh mục điều chỉnh",
          "Đề xuất hướng nghiên cứu và lập kế hoạch triển khai tiếp theo cho từng đề tài",
        ],
      },
    ],
    outcomes: [
      "Xây dựng mô hình kinh tế lượng phù hợp với câu hỏi nghiên cứu.",
      "Tổ chức dữ liệu và viết do-file có cấu trúc.",
      "Ước lượng, kiểm định và diễn giải mô hình OLS.",
      "Phân tích dữ liệu bảng bằng Pooled OLS, FE và RE.",
      "Phát hiện và xử lý các vấn đề kỹ thuật của mô hình.",
      "Lựa chọn giữa robust SE, clustered SE, Driscoll–Kraay và FGLS.",
      "Nhận diện nội sinh và thực hiện IV/2SLS hoặc GMM.",
      "Ước lượng Linear Panel ARDL–PMG.",
      "Xây dựng và diễn giải Nonlinear PMG.",
      "Xuất bảng và trình bày kết quả theo chuẩn luận văn, bài báo.",
      "Sử dụng AI để hỗ trợ lập trình và diễn giải nhưng vẫn kiểm chứng kết quả.",
      "Xác định những điều chỉnh và hướng phát triển tiếp theo cho đề tài.",
    ],
    instructor: INSTRUCTOR_TAM,
    registerNote: REGISTER_NOTE_GENERIC,
  },

  {
    code: "TAPCHI",
    slug: "viet-bai-tap-chi",
    eyebrow: "Khóa chuyên sâu",
    title: "Viết bài tạp chí khoa học trong nước và quốc tế",
    audience:
      "Dành cho người đang viết và muốn công bố bài báo khoa học lĩnh vực khoa học xã hội",
    intro:
      "Sáu module đi hết vòng đời một bài báo: từ bố cục IMRaD, viết abstract và tổng quan, phương pháp và dữ liệu, cho tới chọn tạp chí, submit và trả lời reviewer.",
    curriculum: "modules",
    price: {
      amount: "2.000.000 đ",
      note: "Giảm 10% cho nhóm từ 03 người",
      group: true,
      vnd: 2000000,
    },
    facts: [
      { label: "Lớp trực tiếp", value: "06 module qua Zoom — tối đa 40 học viên" },
      { label: "Kho record", value: "60 giờ 44 phút — 60 bài học" },
      { label: "Xem lại", value: "02 năm kể từ ngày đăng ký" },
    ],
    phases: [
      {
        name: "Tổng quan bài báo khoa học quốc tế",
        sessions: [
          "Tổng quan bài báo khoa học chuẩn bố cục IMRaD đủ điều kiện công bố quốc tế",
          "Phân loại bài báo khoa học",
          "Tiêu chí đánh giá chất lượng bài báo khoa học",
          "Quy trình phản biện tạp chí khoa học",
          "Cấu trúc một bài báo khoa học chuẩn IMRaD",
          "Thực hiện một bài báo khoa học chuẩn IMRaD",
          "Thực hành",
        ],
      },
      {
        name: "Viết tóm tắt, giới thiệu và tổng quan",
        sessions: [
          "Ý tưởng và tên bài báo quốc tế",
          "Thông tin cá nhân",
          "Viết nội dung tóm tắt — Abstract",
          "Viết phần giới thiệu nghiên cứu — Introduction",
          "Viết tổng quan nghiên cứu — Literature review",
        ],
      },
      {
        name: "Viết phương pháp nghiên cứu — Method",
        sessions: [
          "Review các phần cơ bản của một bài báo quốc tế uy tín (Q1, Q2) qua case study",
          "Cách viết phần Phương pháp nghiên cứu, kèm case study cụ thể",
          "Chọn tạp chí uy tín và chiến lược tăng khả năng được chấp nhận",
          "Kinh nghiệm cho tác giả dưới góc nhìn của reviewer tạp chí quốc tế",
          "Thảo luận với học viên",
        ],
      },
      {
        name: "Thu thập và xử lý dữ liệu cho bài báo khoa học",
        sessions: [
          "Kế hoạch thu thập và nguồn dữ liệu",
          "Phương pháp chọn mẫu",
          "Thiết kế phiếu khảo sát",
          "Nguyên tắc và quy trình thu thập dữ liệu",
          "Phương pháp tổng hợp dữ liệu trong kinh tế, kinh doanh, quản lý, tài chính",
          "Quy trình xử lý dữ liệu",
          "Trao đổi và thảo luận",
        ],
      },
      {
        name: "Trình bày dữ liệu nghiên cứu với phần mềm kinh tế lượng",
        sessions: [
          "Kiểu dữ liệu",
          "Phân tích lựa chọn mô hình nghiên cứu định lượng",
          "Giới thiệu một số công cụ xử lý số liệu khảo sát thông dụng (SPSS, Stata…)",
          "Trình bày kết quả nghiên cứu theo chuẩn tạp chí quốc tế uy tín",
          "Ứng dụng phần mềm trong nghiên cứu kinh doanh, quản lý (SPSS)",
          "Ứng dụng phần mềm trong nghiên cứu kinh tế, tài chính (Stata)",
          "Trao đổi và thảo luận",
        ],
      },
      {
        name: "Submit and publish bài báo khoa học",
        sessions: [
          "Phân hạng tạp chí (Q1, Q2, Q3, Q4) trong danh mục ISI/Scopus",
          "Lựa chọn các nhà xuất bản uy tín",
          "Kinh nghiệm tránh nhà xuất bản dỏm, fake, săn mồi",
          "Kỹ năng tìm kiếm tài liệu khoa học liên quan và đáng tin cậy",
          "Công cụ và thủ thuật tăng cường kỹ năng viết tiếng Anh học thuật",
          "Thực hành",
          "Tư vấn riêng cho từng học viên",
        ],
      },
    ],
    outcomes: [
      "Viết được bài bản các mục theo bố cục chuẩn của một công bố trên tạp chí uy tín trong nước và quốc tế.",
      "Phân biệt được tạp chí uy tín với tạp chí dỏm, và nắm quy trình gửi bài trên hệ thống các nhà xuất bản lớn.",
      "Biết cách trả lời nhà bình duyệt (reviewer) và biên tập viên (editor), cũng như xử lý các vấn đề sau khi công bố thành công.",
      "Nhận chứng nhận sau khi hoàn thành khóa học.",
    ],
    registerNote: REGISTER_NOTE_GENERIC,
  },

  {
    code: "BAOCAO",
    slug: "viet-bao-cao-khoa-hoc",
    eyebrow: "Khóa đào tạo",
    title: "Viết báo cáo khoa học, luận văn chuẩn quốc tế",
    audience: "Dành cho sinh viên và học viên cao học",
    intro:
      "Tám buổi đi từ việc chọn đề tài đến lúc bấm nút gửi bài — kèm ba tháng đồng hành sau khóa để bản thảo thật sự tới được tòa soạn.",
    curriculum: "sessions",
    price: {
      amount: "1.000.000 đ",
      note: "Giảm 10% cho nhóm từ 03 người",
      group: true,
      vnd: 1000000,
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
      "Tạo tài khoản để giữ chỗ khóa Research Class (Advanced). Kỳ khai giảng tiếp theo sẽ được thông báo qua email và Zalo.",
  },

  {
    code: "CHATGPT",
    slug: "ung-dung-chatgpt-nckh",
    eyebrow: "Khóa công cụ AI",
    title: "Ứng dụng ChatGPT trong nghiên cứu khoa học",
    audience:
      "Dành cho sinh viên, học viên cao học, nghiên cứu sinh và giảng viên muốn dùng AI có kiểm soát trong quy trình nghiên cứu",
    intro:
      "Bốn module thực hành giúp người học dùng ChatGPT và các công cụ AI để tìm tài liệu, viết, xử lý dữ liệu và kiểm chứng đầu ra mà vẫn giữ liêm chính học thuật.",
    curriculum: "modules",
    price: {
      amount: "550.000 đ",
      note: "Giảm 10% cho nhóm từ 03 người",
      group: true,
      vnd: 550000,
    },
    facts: [
      { label: "Lớp trực tiếp", value: "04 module qua Zoom" },
      { label: "Giờ học", value: "19:30 – 21:00 · 02 buổi / tuần" },
      { label: "Xem lại", value: "02 năm kể từ ngày đăng ký" },
    ],
    phases: [
      {
        name: "Nền tảng và giới hạn của AI trong nghiên cứu",
        sessions: [
          "Hiểu cách ChatGPT tạo câu trả lời và giới hạn khi dùng cho nghiên cứu",
          "Xây dựng prompt hiệu quả cho công việc học thuật",
          "Nhận diện hallucination, trích dẫn giả và thông tin thiếu căn cứ",
          "Kiểm chứng đầu ra AI bằng nguồn học thuật đáng tin cậy",
          "Nguyên tắc liêm chính, bảo mật dữ liệu và trách nhiệm của người nghiên cứu",
          "Khai báo việc sử dụng AI theo yêu cầu của trường và tạp chí",
        ],
      },
      {
        name: "Tìm và tổng quan tài liệu",
        sessions: [
          "Tìm bằng chứng nghiên cứu với Consensus và Elicit",
          "Khám phá mạng lưới trích dẫn bằng Connected Papers",
          "Đọc và hỏi đáp trên bộ tài liệu với NotebookLM",
          "Dựng literature review table theo câu hỏi và khoảng trống nghiên cứu",
          "Tóm tắt, so sánh tài liệu và kiểm chứng lại với bản gốc",
          "Kết nối quy trình tài liệu với EndNote và Zotero",
        ],
      },
      {
        name: "Viết và biên tập bản thảo",
        sessions: [
          "Dùng AI để phát triển đề cương và lập luận nghiên cứu",
          "Viết phần Introduction có kiểm soát và có căn cứ",
          "Hỗ trợ mô tả Method mà không làm sai quy trình đã thực hiện",
          "Phát triển Discussion từ kết quả và tài liệu đối chiếu",
          "Nâng văn phong học thuật tiếng Anh mà vẫn giữ đúng ý tác giả",
          {
            text: "Kiểm tra tỷ lệ AI và đạo văn trong ngưỡng an toàn",
            href: "/kiem-tra-ai-dao-van",
          },
        ],
      },
      {
        name: "Dữ liệu và thực hành trên đề tài của học viên",
        sessions: [
          "Làm sạch, mã hóa và mô tả dữ liệu với sự hỗ trợ của AI",
          "Sinh và kiểm tra cú pháp phân tích cho SPSS",
          "Sinh và kiểm tra cú pháp phân tích cho Stata và R",
          "Đọc output, phát hiện kết luận vượt quá dữ liệu",
          "Dựng bảng và biểu đồ theo chuẩn trình bày của tạp chí",
          "Thực hành quy trình hoàn chỉnh trên đề tài của từng học viên",
        ],
      },
    ],
    outcomes: [
      "Thiết kế được prompt học thuật rõ ràng và quy trình kiểm chứng để hạn chế hallucination.",
      "Tìm, sàng lọc và tổng hợp tài liệu bằng hệ công cụ AI mà vẫn truy về được nguồn gốc.",
      "Dùng AI hỗ trợ viết và biên tập bản thảo có kiểm soát, phù hợp nguyên tắc liêm chính học thuật.",
      "Ứng dụng AI vào làm sạch dữ liệu, sinh cú pháp, đọc output và trình bày kết quả trên đề tài thực tế.",
    ],
    registerNote: REGISTER_NOTE_GENERIC,
  },
] satisfies Course[];
