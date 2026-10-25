/**
 * Vị trí các ghim trên bản đồ hội thảo (components/conference-map.tsx).
 *
 * Chỉ chứa tọa độ: tên hội thảo, thời gian và vai trò đọc thẳng từ
 * `content/conferences.ts`, nên bản đồ không có số liệu riêng nào để lệch với
 * danh sách. Khóa là đúng chuỗi `where` của từng hội thảo.
 *
 * `x`, `y` là phần trăm bề rộng/bề cao của khung bản đồ, theo phép chiếu
 * equirectangular của components/conference-map-land.ts (kinh độ -135…170, vĩ
 * độ 80…-70). Các điểm ở Đông Nam Á cách nhau chưa tới vài độ nên đã được
 * xê dịch nhẹ (dưới 1,5% bề ngang) để ghim không chồng lên nhau.
 */
import { conferences } from "./conferences";

export type MapPoint = {
  x: number;
  y: number;
  /** Ảnh thật của chính hội thảo đó, thay cho chấm tròn. */
  photo?: { src: string; alt: string };
};

export const conferenceMapPoints: Record<string, MapPoint> = {
  "Bangkok, Thailand": {
    x: 76.4,
    y: 44.8,
    photo: {
      src: "/images/hoat-dong/tam-trinh-agba-2024-bangkok.jpg",
      alt: "Các đại biểu tại hội thảo AGBA 2024, Bangkok",
    },
  },
  "Ho Chi Minh City, Vietnam": { x: 79.9, y: 46.6 },
  "Hanoi, Vietnam": { x: 79.4, y: 38.3 },
  "Taichung, Taiwan": {
    x: 84.2,
    y: 37,
    photo: {
      src: "/images/hoat-dong/feng-chia-conference-2023.jpg",
      alt: "Ảnh tập thể các đại biểu tại 2023 Feng Chia Conference, Đài Loan",
    },
  },
  Malaysia: { x: 76.8, y: 51.3 },
  "Warsaw, Poland": { x: 51.1, y: 18.5 },
  "Hong Kong (trực tuyến)": { x: 82, y: 38.7 },
  "Vientiane, Laos": { x: 76.6, y: 41 },
  "Cambridge, Massachusetts, United States": { x: 21, y: 25.1 },
  Singapore: { x: 79.2, y: 53.2 },
  "Istanbul, Turkey": { x: 53.8, y: 26 },
  "Melbourne, Australia": { x: 91.8, y: 78.5 },
  "Canberra, Australia": { x: 93.2, y: 76.9 },
};

/** Hai điểm xuất phát của các cung nối — nơi HDI và các hội thảo trong nước đặt. */
export const conferenceMapOrigins = [
  "Ho Chi Minh City, Vietnam",
  "Hanoi, Vietnam",
] as const;

/** "Bangkok, Thailand" → "Thailand"; "Hong Kong (trực tuyến)" → "Hong Kong". */
export function countryOf(where: string): string {
  const last = where.split(",").pop()!.trim();
  return last.replace(/\s*\(.*\)$/, "");
}

export const conferenceMapSummary = {
  talks: conferences.length,
  countries: new Set(conferences.map((conference) => countryOf(conference.where)))
    .size,
};
