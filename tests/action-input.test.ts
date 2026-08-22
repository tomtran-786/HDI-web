import { describe, expect, it } from "vitest";
import { parseId } from "../lib/action-input";
import { parseCart } from "../lib/cart-cookie";

describe("parseId", () => {
  it("nhận id thật", () => {
    expect(parseId("clx1a2b3c4d5e6f7g8h9i0j1")).toBe("clx1a2b3c4d5e6f7g8h9i0j1");
  });

  it("từ chối object mà Prisma sẽ đọc như một bộ lọc", () => {
    // Đây là cả lý do tồn tại của hàm này: payload RSC deserialize được object,
    // và `where: { id: { not: "" } }` khớp hàng đầu tiên thay vì không khớp gì.
    expect(parseId({ not: "" })).toBeNull();
    expect(parseId({ contains: "c" })).toBeNull();
    expect(parseId({ gt: "" })).toBeNull();
  });

  it("từ chối mảng, số, null, undefined và chuỗi rỗng", () => {
    expect(parseId(["clx1a2b3c4d5e6f7g8h9i0j1"])).toBeNull();
    expect(parseId(42)).toBeNull();
    expect(parseId(null)).toBeNull();
    expect(parseId(undefined)).toBeNull();
    expect(parseId("")).toBeNull();
  });

  it("từ chối chuỗi quá ngắn, quá dài, hoặc có ký tự lạ", () => {
    expect(parseId("abc")).toBeNull();
    expect(parseId("c".repeat(37))).toBeNull();
    expect(parseId("clx1a2b3c4d5e6f7g8h9-0j1")).toBeNull();
  });

  it("dùng chung định nghĩa id với cookie giỏ hàng", () => {
    const id = "clx1a2b3c4d5e6f7g8h9i0j1";
    expect(parseId(id)).toBe(id);
    expect(parseCart(id)).toEqual([id]);
    expect(parseCart("abc")).toEqual([]);
  });
});
