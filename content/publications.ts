/**
 * Peer-reviewed publications, verbatim from reference/site/pages/publications.md.
 * Titles, author lists, journal names and ranking metrics are left in English
 * exactly as published.
 */

export type Publication = {
  year: number;
  authors: string;
  title: string;
  venue: string;
  metrics: string[];
  status?: string;
  doi?: string;
};

export const publicationsIntro = {
  eyebrow: "Công bố",
  title: "Công bố khoa học",
  subtitle: "15 bài báo trên các tạp chí quốc tế có bình duyệt",
};

export const publications: Publication[] = [
  {
    year: 2026,
    authors: "Nguyen, D.G., Su, T.O.H., and Trinh, C.T.",
    title:
      "The Role of Destination Social Responsibility in Shaping Tourists' Responsible Behaviour: A Case Study in Vietnam",
    venue: "Journal for International Business and Entrepreneurship Development, 18(1)",
    metrics: ["ESCI Q2"],
    status: "forthcoming",
  },
  {
    year: 2026,
    authors: "Hong Hanh Doan, Ngoc Duy Phuong Nguyen, Cong Tam Trinh",
    title:
      "Does digital transformation promote economic growth? New evidence in Vietnam",
    venue: "Journal for International Business and Entrepreneurship Development, 18(1), 1-29",
    metrics: ["ESCI Q2"],
  },
  {
    year: 2026,
    authors: "Trinh, C.T., Chao, C.C., and Nguyen, X.",
    title: "Green Energy and Wage Inequality: Is There a Causal Effect?",
    venue: "Energy Economics, 109456",
    metrics: ["A*-ranked (ABDC)", "SSCI Q1"],
  },
  {
    year: 2025,
    authors: "Chao, C.C., Trinh, C.T. and Nguyen, X.",
    title:
      "Public healthcare spending, business dynamism, and wage inequality: Evidence from developed and developing economies",
    venue: "Review of Income and Wealth, 71(1), p.e12712",
    metrics: ["A-ranked (ABDC)", "SSCI Q1", "IF 2.0"],
    doi: "10.1111/roiw.12712",
  },
  {
    year: 2025,
    authors: "Beladi, H., Chao, C.C., Trinh, C.T., and Ee, M.S.",
    title: "Green Financing for ESG Investments and Wages in a Sustainable Economy",
    venue: "International Review of Financial Analysis, 104569",
    metrics: ["A-ranked (ABDC)", "SSCI Q1", "IF 9.8"],
  },
  {
    year: 2025,
    authors: "Minh-Tri Ha, Cong Tam Trinh",
    title: "Intellectual Capital And Economic Growth: New Evidence From Vietnam",
    venue: "Journal for International Business and Entrepreneurship Development, 17(4)",
    metrics: ["ESCI Q2", "IF 1.98"],
    status: "forthcoming",
  },
  {
    year: 2025,
    authors: "Cong Tam Trinh, Minh-Tri Ha, Nhut Quang Ho, Thanh Trung Bui",
    title:
      "Cultural distance, environmentally sustainable social development, and tourism: A study of international visitors to Vietnam",
    venue: "Journal for International Business and Entrepreneurship Development",
    metrics: ["ESCI Q2", "IF 1.98"],
    status: "forthcoming",
  },
  {
    year: 2023,
    authors: "Trinh, C.T., Ha, M.T., Ho, N.Q., and Alang, T.",
    title:
      "National culture, public health spending and life insurance consumption: an international comparison",
    venue: "Humanities and Social Sciences Communications",
    metrics: ["SSCI Q1", "IF 2.73", "Springer Nature"],
    doi: "10.1057/s41599-023-01990-7",
  },
  {
    year: 2023,
    authors: "Chao, C.C., Trinh, C.T. and Nguyen, X.",
    title:
      "Carbon neutrality and wage inequality in a sustainable economy: New evidence from business dynamism",
    venue: "Economic Modelling, 127, p.106462",
    metrics: ["A-ranked (ABDC)", "SSCI Q1", "IF 3.874"],
  },
  {
    year: 2023,
    authors: "Beladi, H., Trinh, C.T., and Chao, C.C.",
    title:
      "Gold prices, cultural factors, and Covid-19 pandemic: An international analysis",
    venue: "Research in International Business and Finance, 66, 102051",
    metrics: ["B-ranked (ABDC)", "SSCI Q1", "IF 6.5"],
  },
  {
    year: 2023,
    authors: "Trinh, C.T., Chao, C.C., and Ho, N.Q.",
    title:
      "Private Health Insurance Consumption and Public Health-Care Provision in OECD Countries: Impact of Culture, Finance, and the Pandemic",
    venue: "North American Journal of Economics and Finance, 64, p.101849",
    metrics: ["B-ranked (ABDC)", "SSCI Q2", "IF 3.136"],
  },
  {
    year: 2023,
    authors: "Ha, M.T., Nguyen, D.T., Ho, Q.N. and Trinh, C.T.",
    title:
      "Unravelling the digital transformation-product innovation nexus: the significance of knowledge sharing and transformational leadership in SMEs",
    venue: "Journal for Global Business Advancement, 16(4), pp.533-558",
    metrics: ["Scopus Q4", "IF 0.328"],
  },
  {
    year: 2021,
    authors: "Trinh, C.T., Nguyen, X., and Sgro, P.",
    title:
      "Culture and the demand for non-life insurance: Empirical evidences from middle-income and high-income economies",
    venue: "Economics of Transition and Institutional Change, 29(3), 431-458",
    metrics: ["A-ranked (ABDC)", "SSCI Q2", "IF 0.914"],
  },
  {
    year: 2020,
    authors: "Trinh, C.T., Nguyen, X., Sgro, P., and Pham, C.",
    title:
      "Culture, financial crisis and the demand for property and accident and health insurance in the OECD countries",
    venue: "Economic Modelling, 93, 480-498",
    metrics: ["A-ranked (ABDC)", "SSCI Q1", "IF 3.874"],
  },
  {
    year: 2016,
    authors: "Trinh, T., Nguyen, X., and Sgro, P.",
    title:
      "Determinants of Non-life Insurance Expenditure in Developed and Developing Countries: An Empirical Investigation",
    venue: "Applied Economics, 48(58): 5639-5653",
    metrics: ["A-ranked (ABDC)", "SSCI Q2", "IF 1.835"],
  },
];

export const publicationYears = [
  ...new Set(publications.map((p) => p.year)),
].sort((a, b) => b - a);
