import { describe, expect, it } from "vitest";
import { courses } from "@/content/course";

/**
 * Tên riêng và thuật ngữ được phép giữ chữ hoa giữa tên khóa.
 *
 * Đây là một danh sách CỐ Ý ngắn và cố ý phải sửa bằng tay. Thêm một khóa mới
 * dùng phần mềm chưa có ở đây thì test đỏ, và người thêm phải quyết định xem
 * chữ hoa đó là tên riêng thật hay chỉ là thói quen gõ Title Case — đúng câu
 * hỏi mà bộ tên khóa cần ai đó trả lời trước khi nó lệch lại.
 */
const PROPER_NOUNS = new Set([
  "AI",
  "SPSS",
  "Stata",
  "SmartPLS",
  "ChatGPT",
  "Zoom",
  "Python",
  "NVivo",
  "Excel",
  "Scopus",
]);

/** Bỏ dấu câu hai đầu để so "SmartPLS" chứ không phải "SmartPLS,". */
function words(title: string): string[] {
  return title
    .split(/[\s]+/)
    .map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter(Boolean);
}

describe("kiểu viết hoa của tên khóa học", () => {
  it.each(courses.map((c) => [c.code, c.title] as const))(
    "%s viết hoa chữ đầu và không IN HOA toàn bộ",
    (_code, title) => {
      expect(title[0]).toBe(title[0].toLocaleUpperCase("vi"));
      // "IN HOA toàn bộ" = không còn chữ thường nào. Một tên toàn viết tắt
      // (nếu sau này có) vẫn hợp lệ, nên phép so là với chính chuỗi đó.
      expect(title).not.toBe(title.toLocaleUpperCase("vi"));
    },
  );

  /**
   * Luật thật sự của bộ tên khóa: sau chữ đầu, chỉ tên riêng mới được viết hoa.
   *
   * Áp Title Case kiểu tiếng Anh lên danh từ chung tiếng Việt ("Nghiên cứu khoa
   * học", "Khóa luận tốt nghiệp") là cách hai tên khóa từng lệch khỏi sáu tên
   * còn lại — và vì mỗi tên lệch một kiểu khác nhau, đọc cả danh sách trông như
   * gõ nhầm chứ không như một quy ước.
   */
  it.each(courses.map((c) => [c.code, c.title] as const))(
    "%s chỉ viết hoa tên riêng ở giữa tên",
    (_code, title) => {
      const offenders = words(title)
        .slice(1)
        .filter(
          (word) =>
            word[0] === word[0].toLocaleUpperCase("vi") &&
            word[0] !== word[0].toLocaleLowerCase("vi") &&
            !PROPER_NOUNS.has(word),
        );
      expect(offenders).toEqual([]);
    },
  );
});
