import { Pool, type PoolClient } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

/**
 * Serverless-tuned Prisma singleton.
 *
 * Ported from the Chemistery codebase, including the reason it looks like this:
 * DATABASE_URL MUST be the transaction-mode pooler (port 6543). Session mode
 * (5432) pins one Postgres backend per client connection; on Vercel a lambda
 * frozen between requests holds that socket open forever, the pool drains, and
 * the whole app loses its database. That is not hypothetical — it took that app
 * down once already.
 *
 * The Prisma CLI is the opposite case and does want session mode; prisma.config.ts
 * points it at DIRECT_DATABASE_URL.
 *
 * Vì đã ở transaction mode, mọi cấu hình dưới đây đi theo hướng NGƯỢC LẠI với
 * phòng thủ của session mode: giữ kết nối sống càng lâu càng tốt. Supavisor
 * multiplex, nên một client rảnh KHÔNG ghim backend Postgres nào — thứ duy nhất
 * nó giữ là một socket TCP rẻ tiền. Đo thực tế trên chính pooler này: một kết
 * nối ấm trả lời trong ~87ms, còn mở kết nối mới mất ~550ms khi thành công và
 * hỏng hẳn ở khoảng một nửa số lần thử. Đóng kết nối lúc rảnh là tự nguyện trả
 * cái giá đó ở mỗi request.
 */

/**
 * Lỗi ở lớp BẮT TAY, không phải lỗi truy vấn.
 *
 * Hai chuỗi này do pg-pool sinh ra: chuỗi đầu khi timeout giết socket đang mở,
 * chuỗi sau khi hết giờ chờ một client rảnh. Cả hai đều là "thử lại có thể
 * được". Lỗi constraint, lỗi cú pháp hay lỗi quyền KHÔNG bao giờ rơi vào đây —
 * thử lại chúng chỉ nhân đôi tác hại.
 */
function isTransientConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("Connection terminated") ||
    error.message.includes("timeout exceeded when trying to connect")
  );
}

/**
 * Thử lại ĐÚNG MỘT LẦN khi việc lấy kết nối hỏng.
 *
 * `Pool.query` cũng đi qua `this.connect`, nên ghi đè ở đây bao cả truy vấn lẻ
 * lẫn transaction. Bọc ở tầng pg thay vì `$extends` để kiểu của PrismaClient
 * không đổi — `PrismaAdapter(prisma)` trong lib/auth.ts và `Prisma.TransactionClient`
 * trong lib/enrollment.ts đều nhận đúng kiểu cũ.
 */
function retryConnectOnce(pool: Pool) {
  const acquire = pool.connect.bind(pool) as () => Promise<PoolClient>;

  async function connectWithRetry(): Promise<PoolClient> {
    try {
      return await acquire();
    } catch (error) {
      if (!isTransientConnectionError(error)) throw error;
      console.warn("[prisma] Mở kết nối hỏng, thử lại một lần:", (error as Error).message);
      return acquire();
    }
  }

  pool.connect = function connect(
    cb?: (err?: Error, client?: PoolClient, release?: (err?: Error | boolean) => void) => void,
  ) {
    const pending = connectWithRetry();
    if (!cb) return pending;
    pending.then(
      (client) => cb(undefined, client, client.release),
      (error: Error) => cb(error),
    );
    return undefined;
    // pg-pool phát hai dạng chữ ký (promise và callback) mà kiểu của nó không
    // diễn đạt được bằng một overload duy nhất.
  } as typeof pool.connect;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL ?? "";
  if (!connectionString) {
    // Hỏng lúc nạp module, giống lib/auth-secret.ts. Trước đây chỗ này chỉ
    // console.warn, nên một deploy cấu hình sai không lộ ra ở build mà lộ ra
    // thành lỗi truy vấn rải rác trên production.
    throw new Error(
      "DATABASE_URL chưa được thiết lập. Xem .env.example — cần chuỗi Supabase transaction pooler (:6543).",
    );
  }

  const pool = new Pool({
    connectionString,
    // Transaction pooler nhận nhiều client ngắn là chuyện bình thường. `max: 1`
    // ép mọi Promise.all thành tuần tự mà không đổi lại được gì.
    max: Number(process.env.PG_POOL_MAX) || (process.env.VERCEL ? 3 : 5),
    // 0 = không bao giờ tự đóng lúc rảnh. Đây là thay đổi quan trọng nhất trong
    // file: nó là thứ giữ cho kết nối sống qua các lần lambda bị đóng băng.
    idleTimeoutMillis: 0,
    // Giữ socket sống qua NAT/load balancer, và phát hiện socket đã chết ngay
    // lúc keepalive trượt thay vì lúc một truy vấn thật đang chạy dở.
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
    // Ngắn hơn ngân sách thời gian của function, và có chừa chỗ cho một lần thử
    // lại. Giá trị cũ là 10s — bằng đúng ngân sách, nên request treo tới lúc hết
    // giờ thay vì kịp chạy nhánh degrade trong components/sections/featured-course.tsx.
    connectionTimeoutMillis: 3_000,
  });

  /**
   * `Pool` là EventEmitter. Khi Supavisor đóng một client đang rảnh mà không ai
   * nghe 'error', Node ném ERR_UNHANDLED_ERROR và giết cả lambda — kể cả khi nó
   * đang phục vụ một request không liên quan. Nghe rồi log là đủ: pg đã tự loại
   * client hỏng khỏi pool trước khi phát sự kiện này.
   */
  pool.on("error", (error) => {
    console.error("[prisma] Kết nối rảnh bị đóng:", error.message);
  });

  retryConnectOnce(pool);

  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

/**
 * Cache ở MỌI môi trường, không chỉ dev.
 *
 * Dev thì để sống sót qua HMR. Production thì vì Next chia server thành nhiều
 * bundle riêng (chunk cho route handler và chunk cho SSR là hai module graph
 * khác nhau), nên file này bị đánh giá nhiều lần trong cùng một lambda và tạo
 * ra nhiều `Pool` song song. Stack trace trên production đã cho thấy Prisma
 * chạy từ hai chunk khác nhau. globalThis là thứ duy nhất chung cho cả hai.
 */
globalForPrisma.prisma = prisma;
