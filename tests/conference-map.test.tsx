import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConferenceMap } from "@/components/conference-map";
import {
  CredibilityMarquee,
  conferenceNames,
  journalNames,
  venueName,
} from "@/components/sections/credibility-marquee";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { conferenceLogos, publisherLogos } from "@/content/credibility-logos";
import { conferences } from "@/content/conferences";
import {
  conferenceMapOrigins,
  conferenceMapPoints,
  conferenceMapSummary,
  countryOf,
} from "@/content/conference-map";
import { publications } from "@/content/publications";
import { stats } from "@/content/stats";

describe("tọa độ bản đồ hội thảo", () => {
  it("mọi địa điểm trong conferences đều có tọa độ nằm trong khung", () => {
    for (const { where } of conferences) {
      const point = conferenceMapPoints[where];
      expect(point, `thiếu tọa độ cho "${where}"`).toBeDefined();
      expect(point.x).toBeGreaterThan(0);
      expect(point.x).toBeLessThan(100);
      expect(point.y).toBeGreaterThan(0);
      expect(point.y).toBeLessThan(100);
    }
  });

  it("không có tọa độ thừa cho địa điểm không còn hội thảo nào", () => {
    const wheres = new Set(conferences.map((conference) => conference.where));
    for (const key of Object.keys(conferenceMapPoints)) {
      expect(wheres.has(key), `"${key}" không còn trong conferences`).toBe(true);
    }
  });

  it("hai điểm xuất phát là địa điểm có thật", () => {
    for (const origin of conferenceMapOrigins) {
      expect(conferenceMapPoints[origin]).toBeDefined();
    }
  });

  it("không hai ghim nào đè lên nhau (cách nhau > 1,2% bề ngang)", () => {
    const points = Object.entries(conferenceMapPoints);
    for (const [i, [nameA, a]] of points.entries()) {
      for (const [nameB, b] of points.slice(i + 1)) {
        const distance = Math.hypot(a.x - b.x, (a.y - b.y) * 2);
        expect(distance, `${nameA} / ${nameB}`).toBeGreaterThan(1.2);
      }
    }
  });

  it("số lần trình bày và số quốc gia khớp subtitle ở content/conferences.ts", () => {
    expect(conferenceMapSummary).toEqual({ talks: 14, countries: 11 });
    expect(countryOf("Hong Kong (trực tuyến)")).toBe("Hong Kong");
    expect(countryOf("Malaysia")).toBe("Malaysia");
    expect(countryOf("Cambridge, Massachusetts, United States")).toBe(
      "United States",
    );
  });
});

describe("bản đồ hội thảo", () => {
  const html = renderToStaticMarkup(<ConferenceMap />);

  it("mỗi địa điểm là một ghim dạng button, kèm tooltip đủ tên và vai trò", () => {
    const wheres = new Set(conferences.map((conference) => conference.where));
    expect(html.match(/<button/g)).toHaveLength(wheres.size);
    expect(html.match(/role="tooltip"/g)).toHaveLength(wheres.size);
    expect(html).toContain("Chair of Session and Presenter");
    expect(html).toContain("Cambridge, Massachusetts, United States");
  });

  it("dùng ảnh thật cho Bangkok và Taichung", () => {
    expect(html).toContain("tam-trinh-agba-2024-bangkok.jpg");
    expect(html).toContain("feng-chia-conference-2023.jpg");
  });

  it("thẻ số liệu lấy số từ content/stats.ts và render sẵn giá trị cuối", () => {
    expect(html).toContain(">25+<");
    expect(html).toContain("US$37,300");
    const text = html.replaceAll("&amp;", "&");
    for (const stat of stats) expect(text).toContain(stat.label);
  });

  it("có một cung nối cho mỗi điểm đến ngoài hai điểm xuất phát", () => {
    const destinations = new Set(
      conferences
        .map((conference) => conference.where)
        .filter((where) => !(conferenceMapOrigins as readonly string[]).includes(where)),
    );
    expect(html.match(/class="map-arc"/g)).toHaveLength(destinations.size);
  });
});

describe("dải chạy công bố", () => {
  it("bỏ volume, số và trang khỏi tên tạp chí", () => {
    expect(venueName("Energy Economics, 109456")).toBe("Energy Economics");
    expect(venueName("Review of Income and Wealth, 71(1), p.e12712")).toBe(
      "Review of Income and Wealth",
    );
    expect(venueName("Applied Economics, 48(58): 5639-5653")).toBe(
      "Applied Economics",
    );
    expect(venueName("Journal for Global Business Advancement, 16(4), pp.533-558")).toBe(
      "Journal for Global Business Advancement",
    );
    expect(venueName("Humanities and Social Sciences Communications")).toBe(
      "Humanities and Social Sciences Communications",
    );
  });

  it("lọc trùng và mỗi tên đều đến từ dữ liệu thật", () => {
    expect(new Set(journalNames).size).toBe(journalNames.length);
    expect(new Set(conferenceNames).size).toBe(conferenceNames.length);
    expect(journalNames.length).toBeLessThan(publications.length);
    expect(conferenceNames).toContain("EBES");
    expect(conferenceNames.filter((name) => name === "EBES")).toHaveLength(1);
    for (const name of journalNames) {
      expect(publications.some((p) => p.venue.startsWith(name))).toBe(true);
    }
  });
});

describe("logo của dải chạy", () => {
  it("mọi tạp chí đã đăng bài đều thuộc một nhà xuất bản có logo", () => {
    const covered = new Set(publisherLogos.flatMap((logo) => logo.journals));
    for (const name of journalNames) {
      expect(covered.has(name), `"${name}" chưa có nhà xuất bản`).toBe(true);
    }
    // Không có tạp chí thừa mà trang không còn đăng bài ở đó.
    for (const name of covered) expect(journalNames).toContain(name);
  });

  it("mọi logo hội thảo khớp một hội thảo thật và file logo có tồn tại", () => {
    const shorts = new Set(conferences.map((conference) => conference.short));
    for (const logo of conferenceLogos) {
      expect(shorts.has(logo.short), `${logo.short} không có trong conferences`).toBe(true);
    }
    for (const logo of [...publisherLogos, ...conferenceLogos]) {
      expect(existsSync(join(process.cwd(), "public", logo.src)), logo.src).toBe(true);
    }
  });

  it("hero render logo với alt, danh sách tạp chí cho trình đọc màn hình, bản lặp bị ẩn", () => {
    const html = renderToStaticMarkup(<CredibilityMarquee />);
    expect(html).toContain('alt="Elsevier"');
    expect(html).toContain('alt="Deakin University"');
    expect(html).toContain("Energy Economics, International Review of Financial Analysis");
    // Chỉ bộ logo đầu của mỗi hàng được đọc; các bản lặp có aria-hidden.
    expect(html.match(/<ul(?![^>]*aria-hidden)/g)).toHaveLength(2);
  });
});
