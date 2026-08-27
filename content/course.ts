/**
 * The courses listed in #khoa-hoc.
 *
 * SOURCES — every fact below is transcribed, not invented:
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
 * ATTRIBUTION — recorded here because the page does not show it. On edubit the
 * four courses are taught by:
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
 * Listing all four under HDI was an explicit instruction (2026-08-20), to be
 * refined later. Keep this block accurate so that refinement is possible.
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
  "stata-kinh-te-luong",
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
 * learning path: foundations (tiểu luận/NCKH/KLTN) → SPSS → Stata → viết bài
 * tạp chí → viết luận văn/báo cáo khoa học → công cụ ChatGPT. Nothing reads a
 * course by index (cart, seed and lookups all go by slug).
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
    instructor: {
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
    },
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
      // Giá nhóm chưa được hệ thống tự áp — luồng đăng ký nhiều người còn phải
      // làm. Đến lúc đó `vnd` của đơn nhóm mới đọc con số này.
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
    eyebrow: "Khóa chuyên sâu",
    title: "Phương pháp NCKH chuyên sâu với SPSS — thực chiến",
    audience:
      "Dành cho sinh viên và học viên cao học đang thực hiện đề tài thuộc lĩnh vực khoa học xã hội",
    intro:
      "Thiết kế nghiên cứu, khung lý thuyết, tổng quan và mô hình — rồi thực hành xử lý dữ liệu ngay trong lớp trên SPSS, từ làm sạch dữ liệu đến đọc và trình bày kết quả.",
    curriculum: "modules",
    price: {
      amount: "1.100.000 đ",
      note: "Giảm 10% cho nhóm từ 03 người",
      vnd: 1100000,
    },
    // No class-size figure on the SPSS page, unlike Stata and tap-chi — so none
    // is claimed here.
    facts: [
      { label: "Lớp trực tiếp", value: "06 module qua Zoom" },
      { label: "Kho record", value: "51 giờ 02 phút — 60 bài học" },
      { label: "Xem lại", value: "02 năm kể từ ngày đăng ký" },
    ],
    phases: [
      {
        name: "Giới thiệu nghiên cứu",
        sessions: [
          "Khái niệm nghiên cứu, nghiên cứu khoa học",
          "Phân loại một công trình nghiên cứu khoa học",
          "Các chuẩn mực cơ bản của công trình nghiên cứu khoa học",
          "Quy trình thực hiện một công trình nghiên cứu khoa học",
          "Thiết kế nghiên cứu và lựa chọn lý thuyết phù hợp",
          "Thảo luận, giải đáp thắc mắc",
        ],
      },
      {
        name: "Tổng quan nghiên cứu và đề xuất mô hình",
        sessions: [
          "Ứng dụng phần mềm VOSviewer trong tổng quan nghiên cứu",
          "Ứng dụng công cụ Elicit trong tổng quan nghiên cứu",
          "Các lý thuyết nền tảng xây dựng mô hình nghiên cứu",
          "Đề xuất mô hình nghiên cứu",
          "Ứng dụng trong một số đề tài cụ thể của sinh viên, học viên cao học",
          "Thảo luận, giải đáp thắc mắc",
        ],
      },
      {
        name: "Phương pháp nghiên cứu cho các ngành khoa học xã hội",
        sessions: [
          "Phương pháp nghiên cứu là gì?",
          "Cấu trúc trình bày đối với phương pháp nghiên cứu",
          "Lựa chọn phương pháp nghiên cứu dựa trên định hướng nghiên cứu",
          "Phương pháp nghiên cứu định tính",
          "Phương pháp nghiên cứu định lượng",
          "Thảo luận, giải đáp thắc mắc",
        ],
      },
      {
        name: "Kỹ thuật phân tích dữ liệu nghiên cứu",
        sessions: [
          "Giới thiệu các phần mềm dùng trong NCKH (SPSS, AMOS, SmartPLS, Stata, EViews, R, Python)",
          "SPSS dùng trong trường hợp nào và những vấn đề cần lưu ý",
          "Phân tích nhân tố và hồi quy OLS: làm sạch dữ liệu, thống kê mô tả, Cronbach’s alpha, EFA, tương quan, đa cộng tuyến",
          "Kỹ thuật phân tích và trình bày: hồi quy Binary Logistic",
          "Mở rộng kiến thức",
          "Thảo luận, giải đáp thắc mắc",
        ],
      },
      {
        name: "Trình bày kết quả nghiên cứu",
        sessions: [
          "Thuật ngữ và văn phong khoa học",
          "Trình bày thuyết minh nghiên cứu, phần mở đầu",
          "Trình bày phần tổng quan và phương pháp nghiên cứu",
          "Trình bày phần cơ sở lý luận",
          "Trình bày kết quả nghiên cứu và thảo luận",
          "Trình bày phần kết luận và tài liệu tham khảo",
        ],
      },
      {
        name: "Tư vấn chi tiết đề tài cho học viên",
        sessions: [
          "Giảng viên trao đổi và tư vấn trực tiếp cách triển khai đề tài cho từng học viên",
          "Học viên đặt câu hỏi và được giải đáp trên chính đề tài của mình",
        ],
      },
    ],
    outcomes: [
      "Nắm được phương pháp nghiên cứu khoa học ứng dụng trong khoa học xã hội và nhân văn, đủ để triển khai tiểu luận, khóa luận tốt nghiệp và đề tài cấp cơ sở.",
      "Hình thành kỹ năng tự nghiên cứu: thu thập, xử lý thông tin và trình bày được kết quả của một đề tài cụ thể một cách độc lập.",
      "Được giảng viên tư vấn trực tiếp đề tài trong khóa học, và tiếp tục đồng hành hỗ trợ sau khóa.",
      "Nhận chứng nhận sau khi hoàn thành khóa học.",
    ],
    registerNote: REGISTER_NOTE_GENERIC,
  },

  {
    code: "STATA",
    slug: "stata-kinh-te-luong",
    eyebrow: "Khóa chuyên sâu",
    title: "Nghiên cứu khoa học chuyên sâu với phần mềm Stata",
    audience:
      "Dành cho sinh viên, học viên cao học, nghiên cứu sinh và giảng viên khối kinh tế, tài chính, quản trị",
    intro:
      "Phần lớn người học dừng lại ở các phần mềm thống kê cơ bản. Khóa này đi thẳng vào những estimator mà bài báo và luận án thực sự cần — FGLS, IV/2SLS, 3SLS, GMM động, PMG — trên dữ liệu kinh tế – tài chính thật.",
    curriculum: "modules",
    price: {
      amount: "1.100.000 đ",
      note: "Giảm 10% cho nhóm từ 03 người",
      vnd: 1100000,
    },
    facts: [
      { label: "Lớp trực tiếp", value: "05 module qua Zoom — tối đa 40 học viên" },
      { label: "Kho record", value: "47 giờ 29 phút — 42 bài học" },
      { label: "Xem lại", value: "02 năm kể từ ngày đăng ký" },
    ],
    phases: [
      {
        name: "Tổng quan về kinh tế lượng ứng dụng và phần mềm Stata",
        sessions: [
          "Tổng quan về kinh tế lượng ứng dụng trong nghiên cứu",
          "Làm quen với phần mềm Stata: do-file, log-file, nhập và quản lý dữ liệu",
          "Ôn tập hồi quy OLS trên Stata và cách đọc output",
          "Trình bày kết quả và thực hành",
        ],
      },
      {
        name: "Các vấn đề mô hình và FGLS trong dữ liệu cắt ngang, chuỗi thời gian",
        sessions: [
          "Phương sai thay đổi (Heteroskedasticity) và FGLS",
          "Đa cộng tuyến (Multicollinearity) và chỉ số VIF",
          "Tự tương quan (Autocorrelation) trong chuỗi thời gian",
          "Thực hành tổng hợp: so sánh OLS, OLS robust SE và FGLS",
        ],
      },
      {
        name: "Nội sinh, biến công cụ và hệ phương trình (IV/2SLS, 3SLS)",
        sessions: [
          "Nội sinh trong mô hình hồi quy và hậu quả với ước lượng OLS",
          "Phương pháp biến công cụ (IV/2SLS) với lệnh ivregress",
          "Hệ phương trình đồng thời và 3SLS với lệnh reg3",
          "Thực hành trên bộ dữ liệu kinh tế – tài chính",
          "Giải đáp thắc mắc",
        ],
      },
      {
        name: "Dữ liệu bảng, GMM động và PMG (Panel ARDL)",
        sessions: [
          "Tổng quan về dữ liệu bảng (Panel data) và thiết lập với xtset",
          "Mô hình tác động cố định và ngẫu nhiên (FE/RE), kiểm định Hausman",
          "Phương sai thay đổi, tự tương quan và phụ thuộc chéo trong panel",
          "Mô hình panel động và GMM (Arellano–Bond, System GMM)",
          "Mô hình PMG (Panel ARDL) với xtpmg",
        ],
      },
      {
        name: "Ôn tập kỹ thuật xử lý dữ liệu và thực hành đề tài của học viên",
        sessions: [
          "Quy trình chuẩn và thiết kế do-file hoàn chỉnh cho một nghiên cứu",
          "Thực hành “mini research project” trên dữ liệu thực tế",
          "Giải đáp thắc mắc và định hướng tự học tiếp",
        ],
      },
    ],
    outcomes: [
      "Nắm vững quy trình phân tích định lượng hoàn chỉnh từ xây dựng mô hình, kiểm định, ước lượng đến báo cáo kết quả trên Stata.",
      "Phát hiện và xử lý được các vấn đề kỹ thuật trong mô hình hồi quy và dữ liệu bảng: phương sai thay đổi, đa cộng tuyến, tự tương quan, phụ thuộc chéo, nội sinh.",
      "Triển khai thành thạo OLS với robust SE, FGLS, IV/2SLS, 3SLS, GMM động và PMG trên dữ liệu kinh tế – tài chính thực tế.",
      "Viết được do-file chuẩn, xuất bảng kết quả và diễn giải theo ngôn ngữ học thuật, phục vụ luận văn, bài báo và báo cáo tư vấn.",
    ],
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
