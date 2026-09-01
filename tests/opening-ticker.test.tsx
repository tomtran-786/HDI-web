import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { courses } from "@/content/course";
import { openingAnnouncements } from "@/lib/courses";
import { OpeningTicker } from "@/components/sections/opening-ticker";

const AIQT = "nckh-ung-dung-ai-xuat-ban-quoc-te";
const TIEULUAN = "training-tieu-luan-nckh-kltn";

const bySlug = (slug: string) => {
  const course = courses.find((item) => item.slug === slug);
  if (!course) throw new Error(`Không tìm thấy khóa ${slug}`);
  return course;
};

describe("openingAnnouncements", () => {
  it("chỉ lấy khóa đã chốt ngày, bỏ khóa để trống", () => {
    const items = openingAnnouncements([...courses]);

    expect(items).toEqual([
      {
        slug: AIQT,
        title: bySlug(AIQT).title,
        startDate: "2026-09-07",
        dateLabel: "07/09/2026",
      },
      {
        slug: TIEULUAN,
        title: bySlug(TIEULUAN).title,
        startDate: "2026-10-05",
        dateLabel: "05/10/2026",
      },
    ]);
  });

  it("sắp theo ngày gần nhất trước, không theo thứ tự soạn thảo", () => {
    const items = openingAnnouncements([bySlug(TIEULUAN), bySlug(AIQT)]);
    expect(items.map((item) => item.slug)).toEqual([AIQT, TIEULUAN]);
  });

  it("không có khóa nào mở thì không có mục nào — đây là nhánh database lỗi", () => {
    expect(openingAnnouncements([])).toEqual([]);
  });
});

describe("ngày khai giảng không được lệch giữa ba chỗ", () => {
  // `opening.startDate`, `eyebrow` và ô "Lịch học" nói về cùng một ngày, nhưng
  // chỉ hai chỗ sau là thứ người đọc nhìn thấy. Kiểm theo `dd/mm` + năm chứ
  // không theo nguyên chuỗi "dd/mm/yyyy": câu prose nén khoảng ngày lại
  // ("05/10 – 19/10/2026"), nên ngày bắt đầu ở đó không có phần năm đi kèm.
  it.each(courses.map((course) => [course.code, course] as const))(
    "%s",
    (_code, course) => {
      const schedule = course.facts.find((fact) => fact.label === "Lịch học");
      expect(schedule).toBeDefined();

      if (!course.opening) {
        expect(schedule!.value).not.toMatch(/\d{2}\/\d{2}\/\d{4}/);
        return;
      }

      const [year, month, day] = course.opening.startDate.split("-");
      expect(course.eyebrow).toContain(`${day}/${month}`);
      expect(course.eyebrow).toContain(year);
      expect(schedule!.value).toContain(`${day}/${month}`);
      expect(schedule!.value).toContain(year);
    },
  );

  it("mọi khóa đều khai báo `opening`, kể cả khi chưa chốt ngày", () => {
    expect(courses.every((course) => "opening" in course)).toBe(true);
  });
});

describe("<OpeningTicker>", () => {
  const items = openingAnnouncements([...courses]);

  it("bản sao dùng để vá vòng lặp là vô hình với trình đọc màn hình", () => {
    const html = renderToStaticMarkup(<OpeningTicker items={items} />);

    // Đúng một nhóm bị ẩn, và mọi liên kết trong đó nằm ngoài thứ tự tab —
    // phần tử focus được nằm trong vùng aria-hidden là lỗi thật.
    expect(html.match(/class="ticker-group ticker-echo"/g)).toHaveLength(1);
    expect(html.match(/aria-hidden="true"/g)?.length).toBeGreaterThanOrEqual(1);
    expect(html.match(/tabindex="-1"/g)).toHaveLength(items.length);
    // Mỗi khóa xuất hiện hai lần: bản thật và bản sao.
    expect(html.match(new RegExp(`href="/khoa-hoc/${AIQT}"`, "g"))).toHaveLength(
      2,
    );
  });

  it("bản thật là một danh sách có tên, ngày ở dạng máy đọc được", () => {
    const html = renderToStaticMarkup(<OpeningTicker items={items} />);

    expect(html).toContain('aria-label="Lịch khai giảng các khóa đang mở đăng ký"');
    expect(html).toContain('<ul class="ticker-group">');
    // Khớp không phân biệt hoa thường: React phát ra `dateTime`, còn trình duyệt
    // đọc thuộc tính HTML không phân biệt hoa thường. Bám vào cách viết của
    // React là để test gãy khi React đổi cách in, dù trang vẫn đúng.
    expect(html).toMatch(/datetime="2026-09-07"/i);
    expect(html).toContain("07/09/2026");
  });

  it("không có mục nào thì không dựng dải rỗng", () => {
    expect(renderToStaticMarkup(<OpeningTicker items={[]} />)).toBe("");
  });
});
