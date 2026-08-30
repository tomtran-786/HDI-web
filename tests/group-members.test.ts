import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findMany: mocks.findMany } },
}));

import { normalizeMemberEmails, resolveGroupMembers } from "@/lib/group-members";
import { GROUP_MAX_SIZE } from "@/lib/group-pricing";

const leader = "nhomtruong@hdi.test";

function ok(result: ReturnType<typeof normalizeMemberEmails>) {
  if (!result.ok) throw new Error(`mong đợi hợp lệ, nhận: ${result.message}`);
  return result.emails;
}

describe("chuẩn hóa email thành viên", () => {
  it("hạ chữ thường, cắt khoảng trắng và giữ nguyên thứ tự đã gõ", () => {
    expect(ok(normalizeMemberEmails(["  B@hdi.test ", "a@hdi.test"], leader))).toEqual([
      "b@hdi.test",
      "a@hdi.test",
    ]);
  });

  it("khử trùng lặp kể cả khi khác kiểu chữ", () => {
    expect(ok(normalizeMemberEmails(["a@hdi.test", "A@HDI.TEST"], leader))).toEqual([
      "a@hdi.test",
    ]);
  });

  /** Tự gõ email mình vào là nhầm lẫn dễ hiểu, không phải lỗi đáng chặn. */
  it("bỏ im lặng email của chính nhóm trưởng", () => {
    expect(ok(normalizeMemberEmails([leader.toUpperCase(), "a@hdi.test"], leader))).toEqual([
      "a@hdi.test",
    ]);
  });

  it("bỏ qua ô trống nhưng từ chối email sai định dạng", () => {
    expect(ok(normalizeMemberEmails(["", "   ", "a@hdi.test"], leader))).toEqual([
      "a@hdi.test",
    ]);
    const bad = normalizeMemberEmails(["khong-phai-email"], leader);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.message).toContain("khong-phai-email");
  });

  it("chặn nhóm vượt quá trần", () => {
    const many = Array.from({ length: GROUP_MAX_SIZE }, (_, i) => `b${i}@hdi.test`);
    expect(normalizeMemberEmails(many, leader).ok).toBe(false);
    // Đúng trần thì vẫn qua: nhóm trưởng + (GROUP_MAX_SIZE - 1) thành viên.
    expect(ok(normalizeMemberEmails(many.slice(0, GROUP_MAX_SIZE - 1), leader))).toHaveLength(
      GROUP_MAX_SIZE - 1,
    );
  });

  it("coi đầu vào không phải mảng là nhóm rỗng", () => {
    expect(ok(normalizeMemberEmails(undefined, leader))).toEqual([]);
    expect(ok(normalizeMemberEmails("a@hdi.test", leader))).toEqual([]);
  });
});

describe("phân giải thành viên", () => {
  beforeEach(() => mocks.findMany.mockReset());

  it("chỉ nhận tài khoản đã xác thực email", async () => {
    mocks.findMany.mockResolvedValue([{ id: "user-a", email: "a@hdi.test" }]);

    const result = await resolveGroupMembers(["a@hdi.test", "chua-co@hdi.test"]);

    expect(result.members).toEqual([{ id: "user-a", email: "a@hdi.test" }]);
    expect(result.unregistered).toEqual(["chua-co@hdi.test"]);
    // Tài khoản chưa xác thực không được coi là thành viên hợp lệ: ghi danh sẽ
    // cấp quyền Drive vào chính địa chỉ đó.
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ emailVerified: { not: null } }),
      }),
    );
  });

  /** Trả về tên thật cho một email bất kỳ sẽ biến endpoint thành máy tra cứu danh tính. */
  it("không bao giờ chọn tên người dùng", async () => {
    mocks.findMany.mockResolvedValue([]);
    await resolveGroupMembers(["a@hdi.test"]);
    const select = mocks.findMany.mock.calls[0][0].select;
    expect(select).toEqual({ id: true, email: true });
  });

  it("không chạm database khi nhóm rỗng", async () => {
    expect(await resolveGroupMembers([])).toEqual({ members: [], unregistered: [] });
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});
