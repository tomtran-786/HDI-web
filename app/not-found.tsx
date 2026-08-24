import Link from "next/link";
import { Section, SectionHeading } from "@/components/ui/section";

export default function NotFound() {
  return (
    <Section soft>
      <div className="mx-auto max-w-2xl text-center">
        <SectionHeading
          eyebrow="404"
          title="Không tìm thấy trang"
          subtitle="Đường dẫn này không tồn tại, đã được chuyển đi hoặc bạn không có quyền xem nội dung đó."
          align="center"
        />
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
          >
            Về trang chủ
          </Link>
          <Link
            href="/tai-khoan"
            className="rounded-full border border-line px-6 py-3 text-sm font-bold text-fg transition hover:border-primary hover:text-primary"
          >
            Mở trang tài khoản
          </Link>
        </div>
      </div>
    </Section>
  );
}
