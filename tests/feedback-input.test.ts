import { describe, expect, it } from "vitest";
import {
  BODY_MAX,
  PAGE_PATH_MAX,
  TITLE_MAX,
  normalizeBody,
  normalizeKind,
  normalizePagePath,
  normalizeTitle,
} from "@/lib/feedback-input";

describe("chuẩn hóa feedback", () => {
  it("chỉ nhận hai loại đã khai báo", () => {
    expect(normalizeKind("bug")).toBe("bug");
    expect(normalizeKind("idea")).toBe("idea");
    expect(normalizeKind("spam")).toBeNull();
    expect(normalizeKind({ bug: true })).toBeNull();
  });

  it("trim, cắt tiêu đề và biến chuỗi rỗng thành null", () => {
    expect(normalizeTitle("  Tiêu đề  ")).toBe("Tiêu đề");
    expect(normalizeTitle("x".repeat(TITLE_MAX + 20))).toHaveLength(TITLE_MAX);
    expect(normalizeTitle("   ")).toBeNull();
    expect(normalizeTitle(null)).toBeNull();
  });

  it("trim, cắt mô tả và biến chuỗi rỗng thành null", () => {
    expect(normalizeBody("  **Chi tiết**  ")).toBe("**Chi tiết**");
    expect(normalizeBody("x".repeat(BODY_MAX + 20))).toHaveLength(BODY_MAX);
    expect(normalizeBody("\n\t ")).toBeNull();
    expect(normalizeBody(123)).toBeNull();
  });

  it("chỉ nhận pathname nội bộ và cắt theo kích thước cột", () => {
    expect(normalizePagePath(" /khoa-hoc ")).toBe("/khoa-hoc");
    expect(normalizePagePath("https://hdi.test/khoa-hoc")).toBeNull();
    expect(normalizePagePath("khoa-hoc")).toBeNull();
    expect(normalizePagePath(`/a${"b".repeat(PAGE_PATH_MAX)}`)).toHaveLength(
      PAGE_PATH_MAX,
    );
  });
});
