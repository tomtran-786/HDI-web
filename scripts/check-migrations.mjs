#!/usr/bin/env node
/**
 * Chặn deploy khi code mới đi trước schema — và KHÔNG làm gì khác.
 *
 * Script này chỉ ĐỌC. Nó không bao giờ chạy DDL, không bao giờ áp migration.
 * `prisma migrate deploy` từng nằm trong buildCommand và đã bị tách ra có chủ
 * đích: máy build của Vercel ở iad1, database ở ap-northeast-2, và một lần rớt
 * kết nối tới pooler đã làm hỏng nguyên một deploy mà commit đó không đụng gì
 * tới schema. Migration vẫn là bước thủ công: `npm run migrate` trước khi push.
 *
 * Vì vậy quy tắc quan trọng nhất ở đây là: KHÔNG kết nối được thì CẢNH BÁO rồi
 * đi tiếp (exit 0). Chỉ chặn khi đọc được database và XÁC NHẬN có migration
 * chưa áp. Một rào chắn tự làm hỏng deploy vì mạng chập là tệ hơn không có rào.
 */
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

// Trên Vercel biến môi trường đã có sẵn — dotenv chỉ để chạy được ở máy dev, và
// nó là devDependency nên không được phép là điều kiện sống còn của build.
try {
  const { config: loadEnv } = await import("dotenv");
  loadEnv({ path: ".env.local" });
  loadEnv({ path: ".env" });
} catch {
  // Không có dotenv: đọc thẳng từ process.env.
}

const MIGRATIONS_DIR = resolve("prisma/migrations");

function warn(message) {
  console.warn(`⚠️  [migrations] ${message}`);
  console.warn("⚠️  [migrations] Bỏ qua kiểm tra, build tiếp tục.");
  process.exit(0);
}

const onDisk = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (onDisk.length === 0) warn("Không có thư mục migration nào trong repo.");

// Session-mode pooler, giống Prisma CLI dùng — xem prisma.config.ts.
const connectionString =
  process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  warn("Thiếu DIRECT_DATABASE_URL lẫn DATABASE_URL.");
}

const client = new pg.Client({
  connectionString,
  connectionTimeoutMillis: 8_000,
  // Không để một database treo giữ máy build lại vô hạn.
  statement_timeout: 8_000,
});

let applied;
try {
  await client.connect();
  const result = await client.query(
    `SELECT migration_name
       FROM _prisma_migrations
      WHERE finished_at IS NOT NULL
        AND rolled_back_at IS NULL`,
  );
  applied = new Set(result.rows.map((row) => row.migration_name));
} catch (error) {
  // Bảng chưa tồn tại là DRIFT thật (database chưa từng chạy migration nào),
  // không phải sự cố mạng — nên nó rơi xuống nhánh chặn bên dưới.
  if (error?.code === "42P01") {
    applied = new Set();
  } else {
    warn(`Không đọc được _prisma_migrations: ${error?.message ?? error}`);
  }
} finally {
  await client.end().catch(() => {});
}

const missing = onDisk.filter((name) => !applied.has(name));

if (missing.length > 0) {
  console.error("\n❌ [migrations] Database đang đi sau code.\n");
  console.error("   Migration có trong repo nhưng chưa được áp:");
  for (const name of missing) console.error(`     • ${name}`);
  console.error(
    "\n   Chạy `npm run migrate` rồi push lại. Deploy code mới lên schema cũ" +
      "\n   làm chết luồng mua hàng — /api/gio-hang và /tai-khoan trả 500.\n",
  );
  process.exit(1);
}

console.log(
  `✅ [migrations] ${onDisk.length}/${onDisk.length} migration đã được áp.`,
);
