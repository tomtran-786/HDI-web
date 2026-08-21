import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Section, SectionHeading } from "@/components/ui/section";
import { CancelOrder } from "@/app/tai-khoan/don-hang/[code]/cancel";

export const metadata: Metadata = {
  title: "Hủy thanh toán — HDI Research Center",
  robots: { index: false, follow: false },
};

export default async function PaymentCancelPage({
  searchParams,
}: PageProps<"/thanh-toan/huy">) {
  const values = await searchParams;
  const code = Number(values.orderCode);
  const returnTo = Number.isInteger(code)
    ? `/thanh-toan/huy?orderCode=${code}`
    : "/tai-khoan/don-hang";
  const session = await auth();
  if (!session?.user?.id) redirect(`/dang-nhap?tiep=${encodeURIComponent(returnTo)}`);
  if (!Number.isInteger(code)) notFound();

  const order = await prisma.order.findFirst({
    where: { code, userId: session.user.id },
    select: { id: true, code: true, status: true },
  });
  if (!order) notFound();

  return (
    <Section soft>
      <div className="mx-auto max-w-xl text-center">
        <SectionHeading
          align="center"
          eyebrow="PayOS"
          title="Bạn đã rời trang thanh toán"
          subtitle="Chỉ mở trang này không hủy đơn. Hãy xác nhận bên dưới để HDI kiểm tra và hủy link PayOS trước khi trả chỗ."
        />
        <div className="flex flex-wrap justify-center gap-4">
          {order.status === "pending" && <CancelOrder orderId={order.id} />}
          <Link className="font-bold text-primary" href={`/tai-khoan/don-hang/${order.code}`}>
            Quay lại đơn #{order.code}
          </Link>
        </div>
      </div>
    </Section>
  );
}

