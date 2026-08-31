import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(process.cwd(), "prisma/migrations/20260831120000_add_referrals/migration.sql"),
  "utf8",
);

/**
 * Toàn bộ những gì bài này canh đều KHÔNG diễn đạt được trong schema.prisma.
 *
 * Prisma không có vị từ WHERE cho `@@unique`, nên bốn unique index có điều kiện
 * dưới đây chỉ tồn tại trong file SQL viết tay. Một lần `migrate dev` sinh lại
 * migration sẽ bỏ quên hết — và không có gì báo lỗi, vì code vẫn chạy đúng cho
 * tới lần đầu tiên có hai request cùng lúc hoặc PayOS giao lại một webhook.
 */
describe("hợp đồng của migration giới thiệu bạn bè", () => {
  it("chặn cộng hoa hồng hai lần cho cùng một đơn", () => {
    expect(sql).toMatch(
      /CREATE UNIQUE INDEX "referral_ledger_commission_order_key"\s+ON "referral_ledger"\("order_id"\) WHERE "type" = 'commission'/,
    );
  });

  it("chốt luật một tài khoản chỉ mang lại hoa hồng đúng một lần", () => {
    expect(sql).toMatch(
      /CREATE UNIQUE INDEX "referral_ledger_commission_referee_key"\s+ON "referral_ledger"\("referee_user_id"\) WHERE "type" = 'commission'/,
    );
  });

  it("chặn một đơn giữ chỗ credits hai lần", () => {
    expect(sql).toMatch(
      /CREATE UNIQUE INDEX "referral_ledger_redemption_order_key"\s+ON "referral_ledger"\("order_id"\) WHERE "type" = 'redemption'/,
    );
  });

  it("chỉ cho mỗi tài khoản một đơn còn sống mang giảm giá giới thiệu", () => {
    // Đây là thứ đóng cuộc đua hai tab checkout mở cùng lúc. Vị từ phải kể cả
    // `paid`, nếu không thì đơn đã trả tiền hết chặn và người ta được giảm lần
    // thứ hai.
    expect(sql).toMatch(
      /CREATE UNIQUE INDEX "orders_referral_discount_once_key"\s+ON "orders"\("user_id"\)\s+WHERE "referral_discount_vnd" > 0 AND "status" IN \('pending', 'paid'\)/,
    );
  });

  it("cấm đơn 0đ ở tầng database", () => {
    // Không có đường xác nhận thanh toán nào ngoài webhook PayOS đã ký, nên một
    // đơn không trả được đồng nào là một đơn không bao giờ mở khóa được.
    expect(sql).toContain('"orders_amount_vnd_positive_check"');
    expect(sql).toMatch(/CHECK \("amount_vnd" > 0\)/);
  });

  it("cấm tự giới thiệu chính mình", () => {
    expect(sql).toContain('"users_referred_by_id_not_self_check"');
    expect(sql).toMatch(/"referred_by_id" IS NULL OR "referred_by_id" <> "id"/);
  });

  it("giữ sổ đọc được kể cả khi đơn hoặc tài khoản liên quan biến mất", () => {
    // CASCADE ở đây sẽ xóa bằng chứng của một khoản đã ghi.
    expect(sql).toMatch(
      /referral_ledger_order_id_fkey[\s\S]*?ON DELETE SET NULL/,
    );
    expect(sql).toMatch(
      /referral_ledger_referee_user_id_fkey[\s\S]*?ON DELETE SET NULL/,
    );
  });

  it("khóa bảng mới khỏi anon key của Supabase", () => {
    expect(sql).toContain('ALTER TABLE "referral_ledger" ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('REVOKE ALL ON "referral_ledger" FROM anon, authenticated');
  });

  it("không xóa dữ liệu thương mại nào", () => {
    expect(sql).not.toMatch(/DELETE\s+FROM\s+"?(orders|payments|enrollments|courses|users)/i);
    expect(sql).not.toMatch(/DROP\s+TABLE/i);
  });
});
