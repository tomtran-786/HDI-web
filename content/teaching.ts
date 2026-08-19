/**
 * Supervision record and teaching.
 * Source: reference/site/pages/supervisions.md and
 * reference/site/pages/teaching-interests.md. Names and unit titles verbatim.
 */

export type Supervision = {
  student: string;
  thesis: string;
  level: string;
  status: "ongoing" | "completed";
};

export const teachingIntro = {
  eyebrow: "Hướng dẫn & giảng dạy",
  title: "Hướng dẫn và giảng dạy",
  subtitle: "Bốn luận án đã và đang hướng dẫn, cùng các học phần đã giảng dạy",
};

export const supervisions: Supervision[] = [
  {
    student: "Le Phuong Dung",
    thesis:
      "Impact of trade facilitation on exporting agricultural products from Vietnam",
    level: "PhD",
    status: "ongoing",
  },
  {
    student: "Nguyen Thanh Tien",
    thesis: "Determinants of quality of life in Viet Nam: Empirical analysis",
    level: "Master",
    status: "completed",
  },
  {
    student: "Le Khanh Huan",
    thesis:
      "Determinants of Investment Attractiveness in Tien Giang: Empirical analysis",
    level: "Master",
    status: "completed",
  },
  {
    student: "Bui Trong Nguyen",
    thesis:
      "Determinants of Healthcare Expenditure in Developed and Developing Economics",
    level: "Master",
    status: "completed",
  },
];

export const teachingInterests = [
  "Microeconomics",
  "Macroeconomics",
  "International Banking and Finance",
  "International Trade",
  "Research Method in Applied Economics",
  "Sales Management",
  "Insurance and Risk Management",
];

export const unitsTaught = [
  "Introduction to Macroeconomics",
  "Introduction to Microeconomics",
  "International Economics",
  "International Banking and Finance",
  "Economics for Manager",
  "Sales Management",
  "Introduction to Business Administration",
  "Insurance and Risk Management",
  "Applied financial management",
];
