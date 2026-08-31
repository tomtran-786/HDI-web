import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: mocks.findUnique, updateMany: mocks.updateMany } },
}));

import { prisma } from "@/lib/prisma";
import {
  ensureReferralCode,
  generateReferralCode,
  normalizeReferralCode,
  REFERRAL_CODE_ALPHABET,
  REFERRAL_CODE_LENGTH,
} from "@/lib/referral-code";

const db = prisma as never;

class UniqueViolation extends Error {
  code = "P2002";
}

describe("mã giới thiệu", () => {
  it("bỏ mọi ký tự dễ đọc nhầm khi chép tay", () => {
    for (const ambiguous of ["O", "I", "L", "0", "1"]) {
      expect(REFERRAL_CODE_ALPHABET).not.toContain(ambiguous);
    }
  });

  it("sinh mã đúng độ dài và chỉ dùng bảng chữ đã chốt", () => {
    for (let i = 0; i < 200; i += 1) {
      const code = generateReferralCode();
      expect(code).toHaveLength(REFERRAL_CODE_LENGTH);
      for (const char of code) expect(REFERRAL_CODE_ALPHABET).toContain(char);
    }
  });

  it("chuẩn hóa mã người dùng gõ vào", () => {
    expect(normalizeReferralCode("  abc23xyz ")).toBe("ABC23XYZ");
    // Cắt đúng độ rộng cột, để một chuỗi dài không thành lỗi database.
    expect(normalizeReferralCode("A".repeat(50))).toHaveLength(12);
    expect(normalizeReferralCode(null)).toBe("");
    expect(normalizeReferralCode(42)).toBe("");
  });
});

describe("cấp mã lười", () => {
  it("trả lại mã cũ và không ghi gì thêm", async () => {
    mocks.findUnique.mockResolvedValueOnce({ referralCode: "ABC23XYZ" });

    await expect(ensureReferralCode(db, "user-1")).resolves.toBe("ABC23XYZ");
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  /**
   * `update` thường sẽ để mã sau đè mã trước. Mã đầu có thể đã kịp được gửi cho
   * bạn bè, nên nó im lặng trở thành mã chết — không có gì báo lỗi cả.
   */
  it("ghi có điều kiện để không đè mã đã phát ra", async () => {
    mocks.findUnique.mockResolvedValueOnce({ referralCode: null });
    mocks.updateMany.mockResolvedValueOnce({ count: 1 });

    const code = await ensureReferralCode(db, "user-1");

    expect(code).toHaveLength(REFERRAL_CODE_LENGTH);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "user-1", referralCode: null },
      data: { referralCode: code },
    });
  });

  it("đọc lại mã của tab thắng cuộc khi mình thua cuộc đua", async () => {
    mocks.findUnique
      .mockResolvedValueOnce({ referralCode: null })
      .mockResolvedValueOnce({ referralCode: "WINNER22" });
    mocks.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(ensureReferralCode(db, "user-1")).resolves.toBe("WINNER22");
  });

  it("thử mã khác khi trùng mã của người khác", async () => {
    mocks.findUnique.mockResolvedValueOnce({ referralCode: null });
    mocks.updateMany
      .mockRejectedValueOnce(new UniqueViolation())
      .mockRejectedValueOnce(new UniqueViolation())
      .mockResolvedValueOnce({ count: 1 });

    const code = await ensureReferralCode(db, "user-1");

    expect(code).toHaveLength(REFERRAL_CODE_LENGTH);
    expect(mocks.updateMany).toHaveBeenCalledTimes(3);
  });

  it("bỏ cuộc sau năm lần thử thay vì ném ra ngoài", async () => {
    mocks.findUnique.mockResolvedValueOnce({ referralCode: null });
    mocks.updateMany.mockRejectedValue(new UniqueViolation());
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(ensureReferralCode(db, "user-1")).resolves.toBeNull();
    expect(mocks.updateMany).toHaveBeenCalledTimes(5);

    quiet.mockRestore();
  });

  it("không nuốt lỗi database khác P2002", async () => {
    mocks.findUnique.mockResolvedValueOnce({ referralCode: null });
    mocks.updateMany.mockRejectedValueOnce(new Error("connection reset"));
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(ensureReferralCode(db, "user-1")).resolves.toBeNull();
    expect(mocks.updateMany).toHaveBeenCalledTimes(1);

    quiet.mockRestore();
  });

  it("trả null cho tài khoản không tồn tại", async () => {
    mocks.findUnique.mockResolvedValueOnce(null);

    await expect(ensureReferralCode(db, "khong-ton-tai")).resolves.toBeNull();
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
});
