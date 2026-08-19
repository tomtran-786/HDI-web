/**
 * Externally funded research projects.
 * Verbatim from reference/site/pages/funded-projects.md.
 */

export type Project = {
  title: string;
  funder: string;
  amount: string;
  amountNote: string;
  duration: string;
  fundedYear: string;
  role: string;
};

export const projectsIntro = {
  eyebrow: "Dự án",
  title: "Dự án nghiên cứu được tài trợ",
  subtitle: "Ba đề tài với tổng kinh phí khoảng US$37,300",
};

export const projects: Project[] = [
  {
    title:
      "Green intellectual capital, green knowledge sharing, green innovation and firm performance in Ho Chi Minh City",
    funder: "Vietnam National University – Ho Chi Minh City (level B)",
    amount: "US$31,000",
    amountNote: "≈ 750 triệu VND",
    duration: "24 tháng",
    fundedYear: "2023",
    role: "Main investigator",
  },
  {
    title: "Cultural Distance and Bilateral Trade: New evidence from Vietnam",
    funder: "International University (VNU-HCMC)",
    amount: "US$2,100",
    amountNote: "≈ 50 triệu VND",
    duration: "24 tháng",
    fundedYear: "2023",
    role: "Principal investigator",
  },
  {
    title:
      "Fostering product innovation through digital transformation: the mediating role of knowledge sharing and the moderating role of leadership styles",
    funder: "International University (VNU-HCMC)",
    amount: "US$4,200",
    amountNote: "≈ 100 triệu VND",
    duration: "12 tháng",
    fundedYear: "2022",
    role: "Main investigator",
  },
];
