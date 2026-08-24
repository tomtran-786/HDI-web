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
 * Điểm trung bình và số lượt của từng khóa ĐÃ DUYỆT, khóa theo `slug`.
 *
 * Raw SQL vì phép tính là một AVG có GROUP BY kèm join sang `courses` để lấy
 * slug — `groupBy` của Prisma trả về `course_id`, và đổi id sang slug ở tầng JS
 * là thêm một truy vấn nữa cho đúng một cột.
 */
export const publishedSummaries = unstable_cache(async (): Promise<Record<string, ReviewSummary>> => {
  const rows = await prisma.$queryRaw<
    { slug: string; average: number; count: bigint }[]
  >`
    SELECT c.slug                        AS slug,
           avg(r.rating)::float8         AS average,
           count(*)::bigint              AS count
      FROM course_reviews r
      JOIN courses c ON c.id = r.course_id
     WHERE r.status = 'published'::review_status
     GROUP BY c.slug`;

  return Object.fromEntries(
    rows.map((row) => [row.slug, { average: row.average, count: Number(row.count) }]),
  );
}, ["published-review-summaries"], { tags: [REVIEWS_TAG] });

/** Các đánh giá đã duyệt, khóa theo `slug`, mới nhất trước. */
export const publishedReviews = unstable_cache(async (): Promise<Record<string, PublicReview[]>> => {
  const rows = await prisma.$queryRaw<
    {
      id: string;
      rating: number;
      comment: string | null;
      createdAt: Date;
      author: string | null;
      slug: string;
    }[]
  >`
    SELECT r.id,
           r.rating,
           r.comment,
           r.created_at AS "createdAt",
           u.name       AS author,
           c.slug       AS slug
      FROM (
            SELECT id, rating, comment, created_at, user_id, course_id,
                   row_number() OVER (
                     PARTITION BY course_id ORDER BY created_at DESC
                   ) AS rn
              FROM course_reviews
             WHERE status = 'published'::review_status
           ) r
      JOIN users   u ON u.id = r.user_id
      JOIN courses c ON c.id = r.course_id
     WHERE r.rn <= 5
     ORDER BY c.slug, r.created_at DESC`;

  const bySlug: Record<string, PublicReview[]> = {};
  for (const row of rows) {
    const list = bySlug[row.slug] ?? [];
    list.push({
      id: row.id,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.createdAt.getTime(),
      // Chỉ `name`. `email` không bao giờ được select ở đây: payload này đi
      // thẳng ra trang công khai, nơi mọi thứ nằm trong view-source.
      author: row.author?.trim() || ANONYMOUS,
    });
    bySlug[row.slug] = list;
  }
  return bySlug;
}, ["published-reviews"], { tags: [REVIEWS_TAG] });

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
