import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/safe-path";

describe("safe post-auth return paths", () => {
  it("preserves a local path", () => {
    expect(safeNext("/dang-ky/viet-bao-cao-khoa-hoc")).toBe(
      "/dang-ky/viet-bao-cao-khoa-hoc",
    );
  });

  it("rejects absolute, protocol-relative and backslash-normalized redirects", () => {
    expect(safeNext("https://evil.example")).toBe("/tai-khoan");
    expect(safeNext("//evil.example")).toBe("/tai-khoan");
    expect(safeNext("/\\evil.example")).toBe("/tai-khoan");
  });
});
