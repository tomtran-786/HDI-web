/**
 * Logo cho dải chạy "Công bố & trình bày tại" ở hero (components/sections/credibility-marquee.tsx).
 *
 * NGUỒN: logo tải từ trang chính thức của từng đơn vị hoặc từ Wikimedia
 * (Commons / Wikipedia), lưu ở public/images/logos/. Tên, nhãn hiệu thuộc về
 * chủ sở hữu; dải này chỉ nói HDI đã công bố hoặc trình bày ở đó, không có
 * nghĩa là đối tác hay được bảo trợ.
 *
 * Tạp chí hiếm khi có logo riêng nên hàng trên là logo NHÀ XUẤT BẢN, kèm danh
 * sách tạp chí thuộc nhà xuất bản đó. Hội thảo VSGE, VSIB, VSBF không có logo
 * dùng được nên không nằm trong hàng dưới (tests/conference-map.test.tsx kiểm
 * rằng mọi tạp chí trong content/publications.ts đều nằm dưới một nhà xuất bản).
 */

export type CredibilityLogo = {
  /** Tên hiển thị cho trình đọc màn hình. */
  name: string;
  src: string;
  /** Kích thước gốc — chỉ dùng cho tỉ lệ khung hình. */
  width: number;
  height: number;
  /** Chiều cao hiển thị (px); chỉnh tay để logo ngang và logo vuông nhìn cân nhau. */
  display: number;
  /** Logo chỉ có nét trắng (dành cho nền tối) — hiển thị thành bóng đen. */
  whiteOnly?: boolean;
};

export type PublisherLogo = CredibilityLogo & {
  /** Tên tạp chí (đúng như `venueName` ở content/publications.ts) thuộc nhà xuất bản này. */
  journals: readonly string[];
};

export type ConferenceLogo = CredibilityLogo & {
  /** Khóa theo `Conference.short` ở content/conferences.ts. */
  short: string;
};

export const publisherLogos: readonly PublisherLogo[] = [
  {
    name: "Elsevier",
    src: "/images/logos/elsevier.svg",
    width: 600,
    height: 91,
    display: 22,
    journals: [
      "Energy Economics",
      "International Review of Financial Analysis",
      "Economic Modelling",
      "Research in International Business and Finance",
      "North American Journal of Economics and Finance",
    ],
  },
  {
    name: "Wiley",
    src: "/images/logos/wiley.svg",
    width: 680,
    height: 144,
    display: 26,
    journals: [
      "Review of Income and Wealth",
      "Economics of Transition and Institutional Change",
    ],
  },
  {
    name: "Springer Nature",
    src: "/images/logos/springer-nature.svg",
    width: 175,
    height: 17,
    display: 18,
    journals: ["Humanities and Social Sciences Communications"],
  },
  {
    name: "Taylor & Francis",
    src: "/images/logos/taylor-francis.svg",
    width: 40,
    height: 40,
    display: 40,
    journals: ["Applied Economics"],
  },
  {
    name: "Inderscience",
    src: "/images/logos/inderscience.svg",
    width: 640,
    height: 114,
    display: 28,
    journals: [
      "Journal for International Business and Entrepreneurship Development",
      "Journal for Global Business Advancement",
    ],
  },
];

export const conferenceLogos: readonly ConferenceLogo[] = [
  {
    short: "AGBA",
    name: "Academy for Global Business Advancement (AGBA)",
    src: "/images/logos/agba.png",
    width: 464,
    height: 458,
    display: 48,
  },
  {
    short: "Feng Chia University",
    name: "Feng Chia University",
    src: "/images/logos/feng-chia-university.svg",
    width: 198,
    height: 51,
    display: 40,
    whiteOnly: true,
  },
  {
    short: "Monash University Malaysia",
    name: "Monash University Malaysia",
    src: "/images/logos/monash-university.svg",
    width: 1024,
    height: 312,
    display: 40,
  },
  {
    short: "EBES",
    name: "Eurasia Business and Economics Society (EBES)",
    src: "/images/logos/ebes.png",
    width: 150,
    height: 145,
    display: 48,
  },
  {
    short: "Hong Kong Online Conference",
    name: "Hong Kong Chu Hai College",
    src: "/images/logos/chu-hai-college.png",
    width: 362,
    height: 280,
    display: 52,
  },
  {
    short: "National University of Laos",
    name: "National University of Laos",
    src: "/images/logos/national-university-of-laos.png",
    width: 320,
    height: 320,
    display: 48,
  },
  {
    short: "ARIA",
    name: "American Risk and Insurance Association (ARIA)",
    src: "/images/logos/aria.png",
    width: 538,
    height: 128,
    display: 28,
  },
  {
    short: "Nanyang Technological University",
    name: "Nanyang Technological University",
    src: "/images/logos/ntu.png",
    width: 700,
    height: 251,
    display: 42,
  },
  {
    short: "Deakin University",
    name: "Deakin University",
    src: "/images/logos/deakin-university.svg",
    width: 1035,
    height: 1034,
    display: 48,
  },
  {
    short: "Australian National University",
    name: "Australian National University",
    src: "/images/logos/anu.svg",
    width: 1745,
    height: 597,
    display: 40,
  },
];
