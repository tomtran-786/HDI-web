import { describe, expect, it } from "vitest";
import { addMemberEmails, MAX_MEMBERS } from "@/lib/group-invite";
import { normalizeMemberEmails } from "@/lib/group-members";

const LEADER = "nhomtruong@example.com";

describe("ô nhập thành viên nhóm", () => {
  it("chuẩn hóa và giữ thứ tự đã gõ", () => {
    expect(addMemberEmails([], "  Ban.A@Example.COM ", LEADER)).toEqual([
      "ban.a@example.com",
    ]);
  });

  it("tách được một danh sách dán vào cùng lúc", () => {
    expect(addMemberEmails([], "a@x.com, b@x.com;c@x.com", LEADER)).toEqual([
      "a@x.com",
      "b@x.com",
      "c@x.com",
    ]);
  });

  /**
   * Đây là lỗi mà module này sinh ra để chặn: nhóm trưởng đã là một ghế, server
   * bỏ địa chỉ của họ đi, nên giữ lại ở client là client đếm nhiều hơn server
   * một người — và số người là thừa số của tổng tiền.
   */
  it("bỏ email của chính nhóm trưởng, kể cả khác kiểu chữ", () => {
    expect(addMemberEmails([], " NhomTruong@Example.com ", LEADER)).toEqual([]);
    expect(addMemberEmails(["a@x.com"], LEADER, LEADER)).toEqual(["a@x.com"]);
  });

  it("đếm số người y hệt server cho cùng một danh sách gõ vào", () => {
    const typed = ["a@x.com", LEADER.toUpperCase(), "A@x.com", "b@x.com"];
    const client = addMemberEmails([], typed.join(", "), LEADER);
    const server = normalizeMemberEmails(typed, LEADER);

    expect(server.ok).toBe(true);
    expect(client).toEqual(server.ok ? server.emails : null);
  });

  it("khử trùng lặp và cắt ở trần thay vì ném lỗi", () => {
    expect(addMemberEmails(["a@x.com"], "a@x.com", LEADER)).toEqual(["a@x.com"]);

    const many = Array.from({ length: MAX_MEMBERS + 5 }, (_, i) => `m${i}@x.com`);
    expect(addMemberEmails([], many.join(" "), LEADER)).toHaveLength(MAX_MEMBERS);
  });

  it("trả về chính mảng cũ khi không có gì được thêm", () => {
    const current = ["a@x.com"];
    expect(addMemberEmails(current, "   ", LEADER)).toBe(current);
  });
});
