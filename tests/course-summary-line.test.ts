import { describe, expect, it } from "vitest";
import { courseSummaryLine } from "@/lib/courses";
import { courses } from "@/content/course";

const TIEULUAN = courses.find((c) => c.code === "TIEULUAN")!;
const AIQT = courses.find((c) => c.code === "AIQT")!;

const item = (course: { code: string; slug: string }) => ({ course });

describe("dòng tóm tắt khóa học của một đơn", () => {
  it("in mã và tên khóa", () => {
    expect(courseSummaryLine([item(TIEULUAN)])).toBe(
      `TIEULUAN · ${TIEULUAN.title}`,
    );
  });

  /**
   * Đây là lý do hàm này tồn tại: một đơn nhóm ba người mua một khóa có ba dòng
   * `order_items`, nên nối thẳng danh sách lại sẽ in cùng một tên ba lần.
   */
  it("gộp các ghế của cùng một khóa thành một mục", () => {
    const line = courseSummaryLine([item(TIEULUAN), item(TIEULUAN), item(TIEULUAN)]);
    expect(line).toBe(`TIEULUAN · ${TIEULUAN.title}`);
  });

  it("giữ đủ các khóa khác nhau, theo thứ tự xuất hiện", () => {
    const line = courseSummaryLine([item(AIQT), item(TIEULUAN), item(AIQT)]);
    expect(line).toBe(
      `AIQT · ${AIQT.title} — TIEULUAN · ${TIEULUAN.title}`,
    );
  });

  /** Một slug không còn trong content không được làm trống cả dòng. */
  it("rơi về slug khi khóa không còn nội dung biên tập", () => {
    expect(courseSummaryLine([item({ code: "CU", slug: "khoa-da-go" })])).toBe(
      "CU · khoa-da-go",
    );
  });

  it("đơn rỗng cho chuỗi rỗng", () => {
    expect(courseSummaryLine([])).toBe("");
  });
});
