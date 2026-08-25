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
      </div>
    </Section>
  );
}
