import { unstable_cache } from "next/cache";
import { COURSES_TAG, REVIEWS_TAG } from "./cache-tags";
import type { PublicAvailability } from "./course-availability";
import { prisma } from "./prisma";
import {
  readPublishedReviews,
  type PublicReview,
  type ReviewSummary,
} from "./reviews";
import type { EnrollmentStatus } from "./generated/prisma/enums";

export type { PublicAvailability } from "./course-availability";

/**
 * A seat stays occupied until its reservation closes or paid access has been
 * successfully revoked. `accessExpiresAt` alone is intentionally insufficient:
 * if Google Drive rejects a revoke, the previous student still has access and
 * a replacement must not be admitted yet.
 */
export async function seatsTaken(courseIds: string[]) {
  const taken = new Map<string, number>();
  if (courseIds.length === 0) return taken;

  const rows = await prisma.$queryRaw<{ courseId: string; held: bigint }[]>`
    SELECT e.course_id AS "courseId", count(*)::bigint AS held
      FROM enrollments e
     WHERE e.course_id = ANY(${courseIds}::text[])
       AND (
         (
           e.status = 'paid'::enrollment_status
           AND e.access_revoked_at IS NULL
         )
         OR (
           e.status = 'pending'::enrollment_status
           AND (
             NOT EXISTS (
               SELECT 1 FROM order_items oi WHERE oi.enrollment_id = e.id
             )
             OR EXISTS (
               SELECT 1
                 FROM order_items oi
                 JOIN orders o ON o.id = oi.order_id
                WHERE oi.enrollment_id = e.id
                  AND o.status = 'pending'::order_status
                  AND o.expires_at > now()
             )
           )
         )
       )
     GROUP BY e.course_id`;

  for (const row of rows) taken.set(row.courseId, Number(row.held));
  return taken;
}

export type CourseHold = {
  status: EnrollmentStatus;
  /**
   * Mã đơn `pending` CỦA CHÍNH người này đang giữ ghế, nếu có.
   *
   * Lọc theo `o.user_id` chứ không chỉ theo ghi danh: một ghế nhóm do người khác
   * trả tiền cũng khóa dòng này, nhưng mã đơn đó không giúp được gì — họ không
   * mở, không hủy và không thanh toán tiếp được đơn của người khác. Cùng lý lẽ
   * với truy vấn `blocking` trong `createOrder`.
   */
  orderCode: number | null;
};

/**
 * The active course reservations/access windows owned by one student.
 *
 * CỐ Ý bất đối xứng với `seatsTaken` ở trên: chỗ kia bỏ qua ghi danh `pending`
 * thuộc đơn đã quá hạn, chỗ này thì không. Nới điều kiện ở đây sẽ nói với học
 * viên rằng khóa còn mua được, rồi `enrollments_user_id_course_id_active_key`
 * — một partial unique index không biết gì về `orders.expires_at` — sẽ chặn
 * lệnh ghi bằng một lỗi P2002 giữa luồng thanh toán. Đường đúng là ĐÓNG đơn
 * chết, và `app/api/gio-hang/route.ts` gọi `reconcileStaleOrdersForPayer`
 * ngay trước khi dùng hàm này.
 *
 * Nhãn "Đang chờ thanh toán" vẫn xuất hiện thường xuyên, vì đơn CHƯA quá hạn thì
 * không đường dọn nào đụng tới: một lần checkout bỏ dở khóa đúng khóa đó suốt
 * `ORDER_TTL_HOURS`. Vì vậy hàm này trả về luôn mã đơn đang chặn — giỏ hàng cần
 * nó để biến một dòng bị khóa thành một đường đi tiếp thay vì một ngõ cụt.
 */
export async function heldByUser(userId: string, courseIds: string[]) {
  const held = new Map<string, CourseHold>();
  if (courseIds.length === 0) return held;

  const rows = await prisma.$queryRaw<
    { courseId: string; status: EnrollmentStatus; orderCode: number | null }[]
  >`
    SELECT e.course_id AS "courseId",
           e.status::text AS status,
           MAX(o.code) AS "orderCode"
      FROM enrollments e
      LEFT JOIN order_items oi ON oi.enrollment_id = e.id
      LEFT JOIN orders o
             ON o.id = oi.order_id
            AND o.user_id = ${userId}
            AND o.status = 'pending'::order_status
     WHERE e.user_id = ${userId}
       AND e.course_id = ANY(${courseIds}::text[])
       AND (
         (
           e.status = 'paid'::enrollment_status
           AND e.access_revoked_at IS NULL
         )
         OR (
           e.status = 'pending'::enrollment_status
         )
       )
     GROUP BY e.course_id, e.status`;

  for (const row of rows) {
    held.set(row.courseId, {
      status: row.status,
      orderCode: row.orderCode === null ? null : Number(row.orderCode),
    });
  }
  return held;
}

/** Fields safe to expose on shopping surfaces. Secrets are absent by design. */
export const COURSE_PUBLIC = {
  id: true,
  code: true,
  slug: true,
  capacity: true,
  priceVnd: true,
  // Cấu hình ưu đãi nhóm là dữ liệu marketing, không phải secret: nó quyết định
  // con số hiện ngay trên giỏ hàng trước khi ai bấm thanh toán.
  groupEligible: true,
  groupPriceVnd: true,
  status: true,
} as const;

/**
 * Every configured course, including closed/draft rows for disabled UI states.
 *
 * KHÔNG cache. Hàm này nuôi `loadCourseCatalog`, tức con số học viên nhìn thấy
 * trên nút "Thanh toán". `createOrder` đọc `price_vnd` sống dưới FOR UPDATE, nên
 * một bản giá cũ ở đây là một hóa đơn sai chứ không phải một lỗi hiển thị.
 * Trang chủ vẫn không chạm database mỗi request vì `landingCourseData` bọc cả
 * lời gọi này trong cache của nó.
 */
export async function configuredCourses() {
  return prisma.course.findMany({ orderBy: { createdAt: "asc" }, select: COURSE_PUBLIC });
}

/**
 * User-independent catalog state for the landing cards.
 *
 * This may trail seat changes by up to five minutes. `createOrder` locks and
 * recounts the course rows, so it remains the authoritative purchase gate.
 */
async function computeCourseSales() {
  const courses = await configuredCourses();
  const occupied = await seatsTaken(courses.map((course) => course.id));
  const seatsLeft = Object.fromEntries(
    courses.map((course) => [
      course.slug,
      Math.max(0, course.capacity - (occupied.get(course.id) ?? 0)),
    ]),
  ) as Record<string, number>;
  const availability = Object.fromEntries(
    courses.map((course) => [
      course.slug,
      course.status !== "open"
        ? "not_open"
        : seatsLeft[course.slug] <= 0
          ? "full"
          : "buyable",
    ]),
  ) as Record<string, PublicAvailability>;
  return { availability, seatsLeft };
}

export const publicAvailability = unstable_cache(
  async () => (await computeCourseSales()).availability,
  ["public-course-availability"],
  { tags: [COURSES_TAG], revalidate: 300 },
);

/**
 * Mọi thứ trang chủ cần từ database, trong MỘT ô cache.
 *
 * Trước đây <FeaturedCourse /> gọi ba hàm cache riêng. Ba ô cache nghĩa là ba
 * lần tra, và mỗi lần trượt là một lượt đi lấy kết nối — thứ đắt nhất trên
 * serverless (xem khối chú thích đầu lib/prisma.ts). Gộp lại thì cả trang chủ
 * trượt cùng lúc hoặc trúng cùng lúc, và lần trượt đó tốn đúng một lượt kết nối.
 *
 * Mang CẢ HAI tag: sửa khóa học (COURSES_TAG) hay duyệt đánh giá (REVIEWS_TAG)
 * đều phải làm ô này bay. Các action ở app/quan-tri và app/tai-khoan đã gọi
 * revalidateTag cho đúng tag của mình, nên không cần đổi gì thêm ở đó.
 *
 * `revalidate: 300` giữ nguyên ngưỡng cũ của availability: số ghế hiện trên thẻ
 * có thể trễ tối đa năm phút, còn `createOrder` mới là cửa chốt — nó khóa dòng
 * và đếm lại ghế trước khi ghi bất cứ thứ gì.
 */
export const landingCourseData = unstable_cache(
  async (): Promise<{
    summaries: Record<string, ReviewSummary>;
    reviews: Record<string, PublicReview[]>;
    availability: Record<string, PublicAvailability>;
    seatsLeft: Record<string, number>;
  }> => {
    const [published, sales] = await Promise.all([
      readPublishedReviews(),
      computeCourseSales(),
    ]);
    return { ...published, ...sales };
  },
  // v2 adds `seatsLeft`; changing the key prevents a previous deployment's
  // cached object (which only had availability/reviews) from reaching Home.
  ["landing-course-data-v2"],
  { tags: [COURSES_TAG, REVIEWS_TAG], revalidate: 300 },
);
