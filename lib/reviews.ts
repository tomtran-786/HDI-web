/**
 * Đánh giá khóa học của học viên — phần đọc/ghi database.
 *
 * Nguồn bằng chứng xã hội DUY NHẤT của trang là chỗ này. content/course.ts ghi
 * rõ số sao và số học viên trên edubit bị bỏ đi có chủ đích vì đó là uy tín của
 * edubit chứ không phải của HDI; con số hiện trên thẻ khóa học phải đến từ
 * người đã trả tiền cho chính HDI, nên mọi đường đọc/ghi ở đây đều đi qua hai
 * cửa: `canReview` (đã mua chưa) và `status = 'published'` (đã duyệt chưa).
 *
 * Phần kiểm tra hình dạng đầu vào nằm ở ./review-input, nơi form phía client
 * import được mà không kéo theo Prisma; re-export bên dưới để mã phía server
 * chỉ cần nhớ một đường dẫn.
 */
import { unstable_cache } from "next/cache";
import { REVIEWS_TAG } from "./cache-tags";
import { prisma } from "./prisma";

export * from "./review-input";

export type ReviewSummary = { average: number; count: number };

export type PublicReview = {
  id: string;
  rating: number;
  comment: string | null;
  /** Epoch milliseconds: plain data survives the cache/RSC serialization boundary. */
  createdAt: number;
  /** Tên hiển thị của người viết. Học viên được báo trước là tên sẽ công khai. */
  author: string;
};

/** Tên rơi vào đây khi tài khoản đăng nhập bằng Google chưa có `name`. */
const ANONYMOUS = "Học viên";

/**
 * Điểm trung bình, số lượt, và năm đánh giá mới nhất — trong MỘT truy vấn.
 *
 * Trước đây đây là hai truy vấn riêng trên cùng bảng `course_reviews`. Truy vấn
 * rẻ, nhưng mỗi truy vấn là một lượt lấy kết nối, và lấy kết nối mới chính là
 * thứ đắt trên serverless (xem khối chú thích đầu lib/prisma.ts).
 *
 * `avg`/`count` là window function trên NGUYÊN partition, được tính TRƯỚC khi
 * `rn <= 5` cắt bớt — nên con số trung bình vẫn là của toàn bộ đánh giá đã
 * duyệt, không phải của riêng năm dòng hiện ra.
 *
 * Không bọc cache ở đây: hai hàm bên dưới và `landingCourseData` trong
 * course-sales.ts mới là chỗ quyết định vòng đời cache.
 */
export async function readPublishedReviews(): Promise<{
  summaries: Record<string, ReviewSummary>;
  reviews: Record<string, PublicReview[]>;
}> {
  const rows = await prisma.$queryRaw<
    {
      id: string;
      rating: number;
      comment: string | null;
      createdAt: Date;
      author: string | null;
      slug: string;
      average: number | null;
      total: bigint | null;
    }[]
  >`
    SELECT r.id,
           r.rating,
           r.comment,
           r.created_at AS "createdAt",
           u.name       AS author,
           c.slug       AS slug,
           r.average    AS average,
           r.total      AS total
      FROM (
            SELECT id, rating, comment, created_at, user_id, course_id,
                   row_number() OVER (
                     PARTITION BY course_id ORDER BY created_at DESC
                   ) AS rn,
                   (avg(rating) OVER (PARTITION BY course_id))::float8 AS average,
                   (count(*)    OVER (PARTITION BY course_id))         AS total
              FROM course_reviews
             WHERE status = 'published'::review_status
           ) r
      JOIN users   u ON u.id = r.user_id
      JOIN courses c ON c.id = r.course_id
     WHERE r.rn <= 5
     ORDER BY c.slug, r.created_at DESC`;

  const summaries: Record<string, ReviewSummary> = {};
  const reviews: Record<string, PublicReview[]> = {};

  for (const row of rows) {
    const list = reviews[row.slug] ?? [];
    list.push({
      id: row.id,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.createdAt.getTime(),
      // Chỉ `name`. `email` không bao giờ được select ở đây: payload này đi
      // thẳng ra trang công khai, nơi mọi thứ nằm trong view-source.
      author: row.author?.trim() || ANONYMOUS,
    });
    reviews[row.slug] = list;

    // Mọi dòng cùng một khóa mang cùng cặp average/total, nên ghi đè là vô hại.
    // `total` về từ Postgres dưới dạng bigint — Number() ở đây chứ không phải ở
    // chỗ đọc, vì unstable_cache tuần tự hóa bằng JSON và JSON không có bigint.
    summaries[row.slug] = {
      average: row.average ?? 0,
      count: Number(row.total ?? 0),
    };
  }

  return { summaries, reviews };
}

/** Điểm trung bình và số lượt của từng khóa ĐÃ DUYỆT, khóa theo `slug`. */
export const publishedSummaries = unstable_cache(
  async (): Promise<Record<string, ReviewSummary>> =>
    (await readPublishedReviews()).summaries,
  ["published-review-summaries"],
  { tags: [REVIEWS_TAG] },
);

/** Các đánh giá đã duyệt, khóa theo `slug`, mới nhất trước. */
export const publishedReviews = unstable_cache(
  async (): Promise<Record<string, PublicReview[]>> =>
    (await readPublishedReviews()).reviews,
  ["published-reviews"],
  { tags: [REVIEWS_TAG] },
);

/**
 * Người này đã trả tiền cho khóa này chưa.
 *
 * Đây là cửa duy nhất canh việc ai được đánh giá — không có nó thì bất kỳ tài
 * khoản đăng nhập nào cũng chấm sao được cho khóa mình chưa từng học.
 *
 * `accessExpiresAt` và `accessRevokedAt` cố tình KHÔNG được xét: hết hạn xem
 * record không xóa việc họ đã trả tiền và đã học xong: đó chính là lúc người ta
 * có nhiều thứ để nói nhất.
 */
export async function canReview(userId: string, courseId: string) {
  const paid = await prisma.enrollment.findFirst({
    where: { userId, courseId, status: "paid" },
    select: { id: true },
  });
  return paid !== null;
}
