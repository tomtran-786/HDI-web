import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(
    process.cwd(),
    "prisma/migrations/20260823120000_add_course_reviews_and_service_orders/migration.sql",
  ),
  "utf8",
);

/**
 * Bốn thứ trong migration này KHÔNG diễn đạt được trong schema.prisma, nên
 * không có gì ngoài bài test này ngăn một lần `migrate dev` sau đó sinh lại
 * migration mà bỏ quên chúng.
 */
describe("hợp đồng của migration đánh giá & đơn dịch vụ", () => {
  it("chốt miền giá trị của số sao ở tầng database", () => {
    expect(sql).toContain('"course_reviews_rating_range"');
    expect(sql).toMatch(/CHECK \("rating" BETWEEN 1 AND 5\)/);
  });

  it("đẩy sàn mã đơn dịch vụ ra khỏi dải của orders", () => {
    // orders bắt đầu ở 100001; PayOS đòi orderCode duy nhất vĩnh viễn cho mỗi
    // merchant, nên hai sequence phải không bao giờ gặp nhau.
    expect(sql).toContain(
      'ALTER SEQUENCE "service_orders_code_seq" RESTART WITH 900000001',
    );
  });

  it("giữ payments là một sổ duy nhất, mỗi hàng đúng một chủ", () => {
    expect(sql).toContain('ALTER TABLE "payments" ALTER COLUMN "order_id" DROP NOT NULL');
    expect(sql).toContain('"payments_exactly_one_owner"');
    expect(sql).toMatch(
      /CHECK \(num_nonnulls\("order_id", "service_order_id"\) = 1\)/,
    );
  });

  it("khóa hai bảng mới khỏi anon key của Supabase", () => {
    expect(sql).toContain('ALTER TABLE "course_reviews" ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('ALTER TABLE "service_orders" ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain(
      'REVOKE ALL ON "course_reviews", "service_orders" FROM anon, authenticated',
    );
    expect(sql).toContain(
      'REVOKE ALL ON SEQUENCE "service_orders_code_seq" FROM anon, authenticated',
    );
  });

  it("không xóa dữ liệu thương mại nào", () => {
    expect(sql).not.toMatch(
      /DELETE\s+FROM\s+"?(orders|payments|enrollments|courses)/i,
    );
    expect(sql).not.toMatch(/DROP\s+TABLE/i);
  });
});
