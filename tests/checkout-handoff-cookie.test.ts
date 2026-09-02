import { describe, expect, it } from "vitest";
import {
  parseHandoff,
  serializeHandoff,
} from "@/lib/checkout-handoff-cookie";

/**
 * Cookie do trình duyệt nắm, nên mọi giá trị đọc ra từ nó là đầu vào của kẻ tấn
 * công. Endpoint thu hồi dùng giá trị này để TÌM đơn (`where` luôn kèm `userId`
 * của phiên), nhưng một chuỗi không đúng khuôn vẫn không được phép đi xuống
 * Prisma — cùng luật với `parseCart`.
 */
describe("dấu bàn giao sang PayOS", () => {
  it.each([
    ["order:100001", { kind: "order", key: "100001" }],
    ["service:" + "a".repeat(32), { kind: "service", key: "a".repeat(32) }],
  ] as const)("đọc được %s", (raw, expected) => {
    expect(parseHandoff(raw)).toEqual(expected);
  });

  it.each([
    ["", "chuỗi rỗng"],
    ["order:", "thiếu mã"],
    ["order:abc", "mã đơn không phải số"],
    ["order:-1", "số âm"],
    ["service:khong-phai-hex", "ref sai khuôn"],
    ["service:" + "a".repeat(31), "ref thiếu một ký tự"],
    ["nguoi-khac:100001", "loại đơn không tồn tại"],
    ["100001", "thiếu tiền tố"],
  ])("từ chối %s (%s)", (raw) => {
    expect(parseHandoff(raw)).toBeNull();
  });

  it("không có cookie thì không có gì để đọc", () => {
    expect(parseHandoff(null)).toBeNull();
    expect(parseHandoff(undefined)).toBeNull();
  });

  it("đọc lại được đúng thứ vừa ghi", () => {
    const handoff = { kind: "order", key: "123456" } as const;
    expect(parseHandoff(serializeHandoff(handoff))).toEqual(handoff);
  });
});
