import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { loadCart, readCartIds } from "@/lib/cart";
import { currentProfile } from "@/lib/current-profile";
import { reconcileStaleOrdersForPayer, syncLiveOrdersForPayer } from "@/lib/orders";
import { isProfileComplete } from "@/lib/profile";
import { referralQuoteFor } from "@/lib/referral-quote";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "auth_required" },
      { status: 401, headers: noStore },
    );
  }

  const user = await currentProfile(session.user.id);
  if (!user) {
    return NextResponse.json(
      { error: "auth_required" },
      { status: 401, headers: noStore },
    );
  }
  if (!isProfileComplete(user)) {
    return NextResponse.json(
      { error: "profile_required" },
      { status: 409, headers: noStore },
    );
  }

  /**
   * Đóng đơn quá hạn của chính người này TRƯỚC khi đọc giỏ và báo giá.
   *
   * Cả `heldByUser` lẫn `referralQuoteFor` đều đọc đơn `pending` mà không xét
   * `expiresAt`, nên một lần checkout bị bỏ dở để lại ba thứ sai cùng lúc: khóa
   * hiện "Đang chờ thanh toán" và bị gỡ khỏi giỏ, số dư credits vẫn bị trừ, và
   * ưu đãi 10% vẫn tính là đã dùng. Trước đây chỉ cron hằng ngày mới gỡ.
   *
   * Đặt ở route handler chứ không trong `lib/cart.ts`: đây là ghi, và render
   * một page thì không được phép ghi. Trường hợp thường gặp là một truy vấn có
   * index trả về 0 dòng rồi trả về ngay.
   */
  await reconcileStaleOrdersForPayer(session.user.id).catch((error) =>
    // Dọn dẹp hỏng không được phép làm sập giỏ hàng: phần tệ nhất còn lại chỉ
    // là con số cũ, đúng hành vi trước khi có bước này.
    console.error("[cart] Không đóng được đơn quá hạn của người dùng:", error),
  );

  /**
   * Rồi tới đơn CHƯA quá hạn: hỏi PayOS xem nó còn sống thật không.
   *
   * Bước trên chỉ biết `expiresAt`. Nó không thấy được đơn đã bị hủy ở phía
   * PayOS mà HDI chưa hay — PayOS không gửi webhook cho việc hủy — nên một cú
   * bấm "Hủy" rồi đóng tab để lại một đơn giữ ghế suốt sáu giờ.
   *
   * `Promise.race` chứ không `await` thẳng: PayOS client đặt `timeout: 10_000,
   * maxRetries: 1`, tức một lượt hỏi có thể mất tới ~20 giây, và mở giỏ hàng
   * không được phép chờ lâu như thế. Hết 5 giây thì bỏ chờ và trả giỏ về ngay;
   * lượt quét vẫn chạy nốt và nếu kịp ghi thì lần mở giỏ sau đã thấy kết quả.
   */
  await Promise.race([
    syncLiveOrdersForPayer(session.user.id).catch((error) =>
      console.error("[cart] Không đồng bộ được đơn đang chờ:", error),
    ),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);

  const [cart, referral] = await Promise.all([
    loadCart(await readCartIds(), session.user.id),
    referralQuoteFor(session.user.id),
  ]);
  return NextResponse.json(
    {
      // Địa chỉ của chính người đang đăng nhập. Giỏ hàng cần nó để ô mời nhóm
      // bỏ qua email của nhóm trưởng đúng như `normalizeMemberEmails` làm ở
      // server — hai quy tắc khác nhau là hai số người khác nhau, và số người
      // là thừa số của tổng tiền hiện trên nút thanh toán.
      email: session.user.email ?? "",
      // Keep this projection explicit. Adding a secret field to an internal
      // catalog object later must not silently make it part of the public API.
      catalog: cart.catalog.map((course) => ({
        id: course.id,
        code: course.code,
        slug: course.slug,
        title: course.title,
        priceVnd: course.priceVnd,
        groupEligible: course.groupEligible,
        groupPriceVnd: course.groupPriceVnd,
        capacity: course.capacity,
        seatsLeft: course.seatsLeft,
        availability: course.availability,
        // Mã đơn đang chặn khóa này. Không phải secret: `code` là số tự tăng
        // đoán được, và trang đơn hàng vẫn tự thu hẹp theo phiên đăng nhập.
        pendingOrderCode: course.pendingOrderCode,
      })),
      staleIds: cart.staleIds,
      // Giỏ hàng tự tính khoản giảm và khoản credits bằng CHÍNH các hàm trong
      // lib/referral-pricing.ts mà server dùng, từ hai dữ kiện này. Gửi sẵn con
      // số tiền xuống sẽ tạo ra một phép tính thứ hai để đi lệch với `createOrder`.
      referral,
    },
    { headers: noStore },
  );
}
