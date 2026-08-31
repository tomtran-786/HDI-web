import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { loadCart, readCartIds } from "@/lib/cart";
import { currentProfile } from "@/lib/current-profile";
import { reconcileStaleOrdersForPayer } from "@/lib/orders";
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
