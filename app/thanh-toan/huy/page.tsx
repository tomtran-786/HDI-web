import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { paymentCancelPage } from "@/content/checkout";
import { allowUserAction } from "@/lib/auth-throttle";
import { currentSession } from "@/lib/current-session";
import { cancelOrder, syncPayosOrderStatus } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { Section, SectionHeading } from "@/components/ui/section";
import { CancelOrder } from "@/app/tai-khoan/don-hang/[code]/cancel";

export const metadata: Metadata = {
  title: "Hủy thanh toán — HDI Research Center",
  robots: { index: false, follow: false },
};

type CancelOutcome =
  | { kind: "released" }
  | { kind: "closed" }
  | { kind: "busy"; reason: "payment_in_progress" | "gateway_unavailable" }
  | { kind: "throttled" }
  | { kind: "confirm" };

/**
 * Nơi PayOS trả người dùng về khi họ bấm "Hủy" giữa chừng.
 *
 * Trang này TỰ TRẢ CHỖ trong đúng một lần tải, thay vì bắt học viên xác nhận
 * thêm hai nhịp nữa. Ghế bị giữ oan tới hai giờ chỉ vì người ta đóng tab là một
 * lỗi không ai nhìn thấy: khóa học trông đầy, và không có gì báo lỗi cả.
 *
 * ĐIỀU KIỆN TỰ HỦY LÀ MỘT VẤN ĐỀ BẢO MẬT, KHÔNG PHẢI TIỆN LỢI.
 *
 * `Order.code` là số tự tăng từ 100001 nên đoán được. Nếu chỉ cần `?orderCode=`
 * là hủy được đơn, thì một thẻ `<img src="…/thanh-toan/huy?orderCode=100123">`
 * nhúng ở trang bất kỳ sẽ hủy đơn của người đang mở tab thanh toán — trình duyệt
 * tự đính kèm cookie phiên, và `cancelOrder` sẽ gọi thẳng `paymentRequests.cancel`
 * lên PayOS khi link còn PENDING. Đó là CSRF kinh điển trên một GET có tác dụng phụ.
 *
 * Nên điều kiện là `?id` — `paymentLinkId` PayOS gửi kèm khi redirect về, 32 ký
 * tự hex, đã nằm sẵn ở `Order.providerRef` từ lúc tạo link. Nó không đoán được và
 * không lộ ra ngoài, nên việc khớp nó đóng vai trò đúng như một CSRF token: chỉ
 * người vừa thật sự đi qua trang PayOS của chính đơn đó mới có.
 *
 * Cố ý KHÔNG đòi `cancel=true` hay `status=CANCELLED`: PayOS có thể đổi cách
 * viết hoa/thường của hai tham số đó, còn `id` mới là thứ mang tính bảo mật.
 * Thiếu `id` hoặc `id` lệch thì trang lùi về hành vi cũ — hiện nút xác nhận —
 * chứ không bao giờ tự hủy.
 */
export default async function PaymentCancelPage({
  searchParams,
}: PageProps<"/thanh-toan/huy">) {
  const values = await searchParams;
  const code = Number(values.orderCode);

  // Chở NGUYÊN query string qua bước đăng nhập. Chỉ giữ `orderCode` thì `id`
  // rụng mất, và người chưa đăng nhập sẽ vĩnh viễn rơi vào nhánh xác nhận thủ
  // công — đúng cái nhịp thừa mà trang này sinh ra để bỏ đi.
  const qs = new URLSearchParams(
    Object.entries(values).flatMap(([key, value]) =>
      typeof value === "string" ? [[key, value] as [string, string]] : [],
    ),
  ).toString();
  const returnTo = Number.isInteger(code)
    ? `/thanh-toan/huy?${qs}`
    : "/tai-khoan/don-hang";
  const session = await currentSession();
  if (!session?.user?.id) redirect(`/dang-nhap?tiep=${encodeURIComponent(returnTo)}`);
  if (!Number.isInteger(code)) notFound();

  const order = await prisma.order.findFirst({
    where: { code, userId: session.user.id },
    select: { id: true, code: true, status: true, providerRef: true },
  });
  if (!order) notFound();

  const paymentLinkId = typeof values.id === "string" ? values.id : null;
  const proven =
    order.status === "pending" &&
    paymentLinkId !== null &&
    order.providerRef !== null &&
    paymentLinkId === order.providerRef;

  let outcome: CancelOutcome = { kind: "confirm" };
  if (!proven && order.status === "pending") {
    /**
     * `id` thiếu hoặc lệch KHÔNG có nghĩa là không làm gì được.
     *
     * Trước đây nhánh này hiện thẳng nút xác nhận, kể cả khi PayOS đã đóng link
     * từ lâu — đúng cái nhịp thừa mà trang này sinh ra để bỏ đi, và nó rơi vào
     * đúng những trường hợp hay gặp nhất: app ngân hàng nuốt mất tham số, hoặc
     * học viên hủy trên một thiết bị rồi mở trang này trên thiết bị khác.
     *
     * `syncPayosOrderStatus` CHỈ ĐỌC. Nó không gọi `paymentRequests.cancel`, nên
     * nó không phải là tác dụng phụ mà chốt CSRF ở trên bảo vệ: kể cả khi một
     * thẻ `<img>` ép được trình duyệt mở URL này, kết quả tệ nhất là HDI ghi
     * nhận đúng một sự thật PayOS đã có sẵn.
     */
    const synced = await syncPayosOrderStatus(order.id, { userId: session.user.id });
    if (synced.closed) outcome = { kind: "released" };
  }
  if (proven) {
    // Cùng hạn mức với nút hủy trong trang đơn hàng: mỗi lần hủy đều là một
    // lượt gọi sang PayOS.
    if (await allowUserAction("order_cancel", session.user.id, 10)) {
      // `cancelOrder` hỏi PayOS TRƯỚC khi trả chỗ, và từ chối khi link đang
      // PAID/PROCESSING/UNDERPAID. Nhờ vậy ngay cả khi ai đó có được
      // `paymentLinkId`, một khoản tiền đang chuyển vẫn không bị phá.
      //
      // Ghi trong lúc render là an toàn với việc render lại (F5, React retry):
      // `cancelOrderLocally` lọc `status: "pending"`, nên lần thứ hai chỉ trả
      // `not_pending` chứ không hủy nhầm gì.
      const result = await cancelOrder(order.id, { userId: session.user.id });
      if (result.cancelled) {
        outcome = { kind: "released" };
      } else if (
        result.reason === "payment_in_progress" ||
        result.reason === "gateway_unavailable"
      ) {
        outcome = { kind: "busy", reason: result.reason };
      } else {
        outcome = { kind: "closed" };
      }
    } else {
      // Chạm trần thì phải NÓI RA. Bản trước lùi về bộ chữ xác nhận chung, nên
      // học viên đọc được "hãy xác nhận bên dưới" rồi bấm vào một nút cũng đang
      // bị chính cái trần đó chặn — một vòng lặp không có lối ra và không có
      // dòng nào giải thích.
      outcome = { kind: "throttled" };
    }
  }

  // KHÔNG gọi `revalidateTag(COURSES_TAG)` ở đây, dù `cancelMyOrder` có gọi:
  // `revalidateTag` chỉ dùng được trong Server Function và Route Handler, không
  // dùng được lúc render page. Hệ quả là bộ đếm ghế công khai (cache 300s) trễ
  // tối đa 5 phút, và trễ theo chiều an toàn — khóa học trông đầy hơn thực tế,
  // không bao giờ bán quá chỗ.

  const heading =
    outcome.kind === "released"
      ? paymentCancelPage.released
      : outcome.kind === "closed"
        ? paymentCancelPage.closed
        : outcome.kind === "throttled"
          ? paymentCancelPage.throttled
          : outcome.kind === "busy"
            ? {
                title: paymentCancelPage.busy.title,
                subtitle: paymentCancelPage.busy[outcome.reason],
              }
            : paymentCancelPage.confirm;

  // Nút xác nhận chỉ còn ý nghĩa khi đơn vẫn đang chờ VÀ trang chưa trả được
  // chỗ: sau khi tự hủy thành công nó là một nút chết.
  const showManualCancel =
    order.status === "pending" &&
    (outcome.kind === "confirm" || outcome.kind === "busy");

  return (
    <Section soft>
      <div className="mx-auto max-w-xl text-center">
        <SectionHeading
          align="center"
          eyebrow={paymentCancelPage.eyebrow}
          title={heading.title}
          subtitle={heading.subtitle}
        />
        <div className="flex flex-wrap justify-center gap-4">
          {showManualCancel && <CancelOrder orderId={order.id} />}
          <Link
            className="font-bold text-primary"
            href={`/tai-khoan/don-hang/${order.code}`}
          >
            {paymentCancelPage.backToOrder(order.code)}
          </Link>
        </div>
      </div>
    </Section>
  );
}
