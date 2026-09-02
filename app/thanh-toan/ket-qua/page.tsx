import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentSession } from "@/lib/current-session";
import { syncPayosOrderStatus } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { paymentResultPage } from "@/content/checkout";
import { Section, SectionHeading } from "@/components/ui/section";
import { PaymentPoll } from "@/components/payment-poll";

export const metadata: Metadata = {
  title: "Kết quả thanh toán — HDI Research Center",
  robots: { index: false, follow: false },
};

export default async function PaymentResultPage({
  searchParams,
}: PageProps<"/thanh-toan/ket-qua">) {
  const values = await searchParams;
  const code = Number(values.orderCode);
  const returnTo = Number.isInteger(code)
    ? `/thanh-toan/ket-qua?orderCode=${code}`
    : "/tai-khoan/don-hang";
  const session = await currentSession();
  if (!session?.user?.id) {
    redirect(`/dang-nhap?tiep=${encodeURIComponent(returnTo)}`);
  }
  if (!Number.isInteger(code)) notFound();

  const order = await prisma.order.findFirst({
    where: { code, userId: session.user.id },
    select: { id: true, code: true, status: true },
  });
  if (!order) notFound();

  // Chỉ ĐỌC trạng thái link, không hủy gì ở PayOS. Trang này là returnUrl nên
  // phần lớn lượt vào đây là người vừa trả tiền xong — `syncPayosOrderStatus`
  // để nguyên mọi trạng thái có tiền và chỉ đóng đơn khi chính PayOS đã coi link
  // là chết. Không có bước này, một link bị hủy hoặc hết hạn sẽ hiện "đang chờ
  // xác nhận" rồi poll tám vòng vào hư không.
  const synced =
    order.status === "pending"
      ? await syncPayosOrderStatus(order.id, { userId: session.user.id })
      : { closed: false as const };
  const status = synced.closed ? synced.as : order.status;

  const paid = status === "paid";
  // Ba trạng thái, không phải hai. Trước đây mọi thứ không phải `paid` đều đọc
  // là "đang chờ PayOS xác nhận", nên một đơn đã hủy vẫn được vẽ như một đơn
  // sắp có tiền về — và cái nút poll bên dưới hứa một điều không bao giờ tới.
  const waiting = status === "pending";

  return (
    <Section soft>
      <div className="mx-auto max-w-xl text-center">
        <SectionHeading
          align="center"
          eyebrow="PayOS"
          title={
            paid
              ? "Đã xác nhận thanh toán"
              : waiting
                ? "Đang chờ PayOS xác nhận"
                : paymentResultPage.closed.title
          }
          subtitle={
            paid
              ? "Webhook đã được kiểm tra và đơn hàng đã chuyển sang trạng thái đã thanh toán."
              : waiting
                ? "Trang quay lại không tự đánh dấu đã trả tiền. HDI đang chờ webhook có chữ ký hợp lệ."
                : paymentResultPage.closed[
                    status as keyof typeof paymentResultPage.closed
                  ] ?? paymentResultPage.closed.title
          }
        />
        <Link
          className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg"
          href={paid ? "/tai-khoan" : `/tai-khoan/don-hang/${order.code}`}
        >
          {paid ? "Vào khu vực học viên" : `Xem đơn #${order.code}`}
        </Link>
        {waiting && (
          <PaymentPoll
            statusUrl={`/api/trang-thai-don?donHang=${order.code}`}
            banDau={status}
          />
        )}
      </div>
    </Section>
  );
}
