import { describe, expect, it } from "vitest";

import { courses } from "@/content/course";

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
