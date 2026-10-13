/**
 * International conferences and seminars.
 * Verbatim from reference/site/pages/conferences.md — conference names,
 * institutions and roles are kept in English as published.
 *
 * `url` dẫn tới trang chính thức của từng hội thảo (hoặc đơn vị tổ chức khi
 * hội thảo không có trang riêng); mỗi link đã được mở và đối chiếu tiêu đề,
 * ngày với dòng tương ứng. ASEAN Forum 2018 (NUOL) và HDR Colloquium 2015
 * (Deakin) không có trang công khai nên để trống.
 */

export type Conference = {
  name: string;
  when: string;
  where: string;
  role: string;
  url?: string;
};

export const conferencesIntro = {
  eyebrow: "Hội thảo",
  title: "Hội thảo quốc tế",
  subtitle: "14 lần trình bày tại Hoa Kỳ, Australia, Ba Lan, Thổ Nhĩ Kỳ, Singapore, Lào, Hong Kong, Đài Loan, Malaysia, Thái Lan và Việt Nam",
};

export const conferences: Conference[] = [
  {
    name: "The 20th Annual World Congress of the Academy for Global Business Advancement (AGBA 2024)",
    when: "8–10/7/2024",
    where: "Bangkok, Thailand",
    role: "Chair of Session and Presenter",
    url: "https://agba.us/",
  },
  {
    name: "The Vietnam Symposium in Global Economic Issues 2023 (VSGE2023)",
    when: "30–31/10/2023",
    where: "Ho Chi Minh City, Vietnam",
    role: "Chair of Session and Presenter",
    url: "https://vsge2023.sciencesconf.org/",
  },
  {
    name: "The 2023 Feng Chia Conference — Recent Advances in Sustainable Development, Green Finance, and Regional Cooperation, Department of Economics, Feng Chia University",
    when: "20/6/2023",
    where: "Taichung, Taiwan",
    role: "Discussant and Presenter",
    url: "https://econ.fcu.edu.tw/",
  },
  {
    name: "The 2022 Vietnam Symposium in International Business (VSIB2022)",
    when: "31/10 – 1/11/2022",
    where: "Ho Chi Minh City, Vietnam",
    role: "Chair of Session and Presenter",
    url: "https://vsib2022.sciencesconf.org/",
  },
  {
    name: "Women Entrepreneurs in Asia (WEA 2022): Empowering vulnerable communities, Monash University Malaysia",
    when: "7/2022",
    where: "Malaysia",
    role: "Co-organizer and Presenter",
    url: "https://www.monash.edu/business/events/past-events/women-entrepreneurs-in-asia-wea-2022-empowering-vulnerable-communities",
  },
  {
    name: "The 38th Eurasia Business and Economic Society (EBES) Conference",
    when: "1/2022",
    where: "Warsaw, Poland",
    role: "Presenter",
    url: "https://ebesweb.org/conferences/past-conferences/38th-ebes-conference-warsaw/38th-ebes-conference-warsaw/",
  },
  {
    name: "The 2021 Vietnam Symposium in Banking and Finance (VSBF2021)",
    when: "28–30/10/2021",
    where: "Hanoi, Vietnam",
    role: "Chair of Session and Presenter",
    url: "https://vsbf2021.sciencesconf.org/",
  },
  {
    name: "Hong Kong on-line Conference on Recent Advances in International Trade, Finance, Business and Regional Cooperation 2020",
    when: "2020",
    where: "Hong Kong (trực tuyến)",
    role: "Presenter",
    url: "https://chuhai.edu.hk/news/hong-kong-line-conference-recent-advances-international-trade-finance-business-and-regional",
  },
  {
    name: "The 1st ASEAN Financial Development and Creating Shared Value Forum, National University of Laos",
    when: "2/2018",
    where: "Vientiane, Laos",
    role: "Presenter",
  },
  {
    name: "American Risk and Insurance Association (ARIA) 2016 Annual Meeting",
    when: "8/2016",
    where: "Cambridge, Massachusetts, United States",
    role: "Presenter",
    url: "https://www.aria.org/assets/Annual-Meeting/Past_Events/ARIA_2016.pdf",
  },
  {
    name: "The 2016 Insurance Risk and Finance Research Conference, Nanyang Technological University",
    when: "6/2016",
    where: "Singapore",
    role: "Presenter",
    url: "https://www.ntu.edu.sg/irfrc/news-events/events/detail/2016/06/16/default-calendar/call-for-papers---insurance-risk-research-conference-2016",
  },
  {
    name: "The 19th Eurasia Business and Economic Society (EBES) Conference, Istanbul Technical University",
    when: "5/2016",
    where: "Istanbul, Turkey",
    role: "Presenter",
    url: "https://ebesweb.org/conferences/past-conferences/19th-ebes-conference-istanbul/",
  },
  {
    name: "The Faculty of Business and Law HDR Colloquium, Deakin University",
    when: "10/2015",
    where: "Melbourne, Australia",
    role: "Presenter",
  },
  {
    name: "The Asia-Pacific Trade Seminars (APTS), Australian National University",
    when: "6/2015",
    where: "Canberra, Australia",
    role: "Presenter",
    url: "https://www.furusawa.e.u-tokyo.ac.jp/APTS/past-programs/APTS2015Program.pdf",
  },
];
