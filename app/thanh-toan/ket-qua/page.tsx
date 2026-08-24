import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentSession } from "@/lib/current-session";
import { prisma } from "@/lib/prisma";
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
    select: { code: true, status: true },
  });
  if (!order) notFound();
  const paid = order.status === "paid";

  return (
    <Section soft>
      <div className="mx-auto max-w-xl text-center">
        <SectionHeading
          align="center"
          eyebrow="PayOS"
          title={paid ? "Đã xác nhận thanh toán" : "Đang chờ PayOS xác nhận"}
          subtitle={
            paid
              ? "Webhook đã được kiểm tra và đơn hàng đã chuyển sang trạng thái đã thanh toán."
              : "Trang quay lại không tự đánh dấu đã trả tiền. HDI đang chờ webhook có chữ ký hợp lệ."
          }
        />
        <Link className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg" href={`/tai-khoan/don-hang/${order.code}`}>
          Xem đơn #{order.code}
        </Link>
        {!paid && (
          <PaymentPoll
            statusUrl={`/api/trang-thai-don?donHang=${order.code}`}
            banDau={order.status}
          />
        )}
      </div>
    </Section>
  );
}
