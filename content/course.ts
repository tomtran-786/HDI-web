/**
 * The courses listed in #khoa-hoc.
 *
 * SOURCES — every fact below is transcribed, not invented:
 *
 * 1. `viet-bao-cao-khoa-hoc` — the eight session titles, the tuition, the group
 *    discount, the format, the duration and the class hours all come from the
 *    course flyer at reference/site/images/image-53a4a7a37922.png (linked from
 *    pages/courses.md). Its four `phases` names are the one exception: an
 *    editorial grouping added so a reader can see the arc of the course. They
 *    are NOT text from the flyer. The session titles under them keep the
 *    flyer's exact wording and order, so "Buổi 1" … "Buổi 8" still map
 *    one-to-one onto the poster.
 *
 * 2. The other four are transcribed from reference/edubit/courses/*.md, crawled
 *    from thayphongdang.edubit.vn by reference/scrape_edubit_courses.py.
 *    Syllabus, tuition, duration and class size are that site's own text.
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
 * Tuition is edubit's current price and will drift if they reprice. Student
 * counts and star ratings are deliberately omitted: they are edubit's social
 * proof, not HDI's.
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
   */
  price: { amount: string; note: string; vnd: number };
  facts: { label: string; value: string }[];
  phases: CoursePhase[];
  outcomes: string[];
  registerNote: string;
};

/**
 * The registration form is one shared Google Form. Only the flagship course has
 * a documented option to pick ("Research Class (Advanced)", from the flyer);
 * for the edubit-sourced courses the form's own wording has not been checked,
 * so the note stays generic rather than sending people to a field that may not
 * exist. Replace with the real option name once the form is confirmed.
 */
const REGISTER_NOTE_GENERIC =
  "Khi điền form đăng ký, ghi rõ tên khóa học bạn muốn tham gia để được xếp đúng lớp.";

export const coursesIntro = {
  eyebrow: "Khóa học",
  title: "Các khóa đào tạo",
  subtitle:
    "Từ bài tiểu luận đầu tiên đến kinh tế lượng nâng cao và công bố quốc tế",
  intro:
    "Mỗi khóa học ứng với một chặng khác nhau của hành trình nghiên cứu. Bấm vào từng khóa để xem lộ trình chi tiết.",
};

export const courses: Course[] = [
  {
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
      'Khi điền form đăng ký, chọn mục "Research Class (Advanced)" để vào đúng lớp học này.',
  },

  {
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
      { label: "Hình thức", value: "Trực tuyến qua Zoom, có record xem lại" },
      { label: "Thời lượng", value: "47 giờ 29 phút — 42 bài học" },
      { label: "Quy mô lớp", value: "Tối đa 40 học viên" },
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
    facts: [
      { label: "Hình thức", value: "Trực tuyến qua Zoom, có record xem lại" },
      { label: "Thời lượng", value: "51 giờ 02 phút — 60 bài học" },
      { label: "Xem lại record", value: "02 năm kể từ ngày đăng ký" },
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
      { label: "Hình thức", value: "Trực tuyến qua Zoom, có record xem lại" },
      { label: "Thời lượng", value: "60 giờ 44 phút — 60 bài học" },
      { label: "Quy mô lớp", value: "Tối đa 40 học viên" },
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
    slug: "training-tieu-luan-nckh-kltn",
    eyebrow: "Khóa nền tảng",
    title: "Training viết tiểu luận, NCKH, khóa luận tốt nghiệp",
    audience:
      "Dành cho sinh viên từ năm nhất đến năm tư và học viên cao học chưa được hướng dẫn bài bản",
    intro:
      "Ba buổi Zoom cùng học liệu online, đi từ cách đặt tên đề tài và tìm nguồn tài liệu uy tín đến văn phong khoa học, trích dẫn, định dạng Word và cách viết không bị đạo văn.",
    curriculum: "modules",
    price: {
      amount: "220.000 đ",
      note: "Giảm 10% cho nhóm từ 03 người",
      vnd: 220000,
    },
    facts: [
      { label: "Hình thức", value: "03 buổi Zoom + học liệu online" },
      { label: "Thời lượng", value: "35 giờ 34 phút — 40 bài học" },
      { label: "Xem lại record", value: "03 năm kể từ ngày đăng ký" },
    ],
    phases: [
      {
        name: "Đề tài, tài liệu và bố cục bài",
        sessions: [
          "Tìm kiếm, đặt tên đề tài và phân tích đề tài",
          "Tìm kiếm các nguồn tài liệu uy tín",
          "Cách đọc tài liệu và dùng công cụ hỗ trợ (ChatGPT, NotebookLM, EndNote 21, Literature review table)",
          "Tư duy xây dựng bố cục bài",
          "Cách viết phần đặt vấn đề / phần mở đầu",
          "Nhận xét bài thực tế và chữa bài tập về nhà",
        ],
      },
      {
        name: "Viết nội dung và trình bày dữ liệu",
        sessions: [
          "Thiết kế bảng hỏi đơn giản, thực hành trên Google Form",
          "Trình bày nội dung theo logic, văn phong khoa học và có tính phản biện",
          "Cách trích dẫn tài liệu tham khảo trong bài",
          "Trình bày và phân tích thông tin từ bảng dữ liệu, biểu đồ",
          "Cách viết tiểu kết và kết luận cho bài",
          "Nhận xét bài thực tế và chữa bài tập về nhà",
        ],
      },
      {
        name: "Định dạng, trích dẫn và chống đạo văn",
        sessions: [
          "Cài đặt Microsoft Word chuẩn trước khi viết bài",
          "Cách làm mục lục tự động",
          "Trích dẫn nguồn cho hình ảnh, bảng biểu, sơ đồ",
          "Tạo và edit danh mục tài liệu tham khảo trên EndNote 20, 21",
          "Một số định dạng cơ bản khác (đánh số trang nhiều kiểu trong bài)",
          "Cách viết bài không bị đạo văn và cách sửa khi bị đạo văn (Turnitin, Kiemtratailieu), tỷ lệ AI",
          "Ứng dụng công cụ AI để tìm tài liệu, tổng quan nghiên cứu và giảm tỷ lệ đạo văn",
        ],
      },
    ],
    outcomes: [
      "Nắm được quy trình từ A–Z để hoàn thành tiểu luận, nghiên cứu khoa học, báo cáo thực tập và khóa luận tốt nghiệp.",
      "Sử dụng được các công cụ AI hỗ trợ nghiên cứu như ChatGPT, Consensus, NotebookLM, Connected Papers và EndNote 21.",
      "Nhận bộ tài liệu gồm 19 tài liệu khác nhau: các bài tiểu luận, NCKH, khóa luận và thuyết minh đề tài đạt điểm 9 – 9.9 (A+).",
      "Được nhận xét và góp ý bài viết thực tế ngay trong khóa học.",
    ],
    registerNote: REGISTER_NOTE_GENERIC,
  },
];
