import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/safe-path";

describe("safe post-auth return paths", () => {
  it("preserves a local path", () => {
    expect(safeNext("/?cart=1&course=viet-bao-cao-khoa-hoc")).toBe(
      "/?cart=1&course=viet-bao-cao-khoa-hoc",
    );
  });

  it("rejects absolute, protocol-relative and backslash-normalized redirects", () => {
    expect(safeNext("https://evil.example")).toBe("/tai-khoan");
    expect(safeNext("//evil.example")).toBe("/tai-khoan");
    expect(safeNext("/\\evil.example")).toBe("/tai-khoan");
  });

  /**
   * Cùng lỗ hổng với "//" nhưng viết bằng ký tự không nhìn thấy: trình duyệt bỏ
   * tab, CR và LF khi phân tích URL, nên "/<TAB>/evil.example" chỉ trở thành
   * "//evil.example" đúng lúc nó được đi theo — sau khi đã qua hết kiểm tra.
   */
  it("rejects control characters a browser would strip out of the URL", () => {
    expect(safeNext("/\t/evil.example")).toBe("/tai-khoan");
    expect(safeNext("/\n/evil.example")).toBe("/tai-khoan");
    expect(safeNext("/\r/evil.example")).toBe("/tai-khoan");
    expect(safeNext("/\u0000/evil.example")).toBe("/tai-khoan");
    expect(safeNext("/\u007f/evil.example")).toBe("/tai-khoan");
  });
});
