import { Section } from "@/components/ui/section";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <Section soft>
      <Skeleton className="mb-3 h-3 w-20" />
      <Skeleton className="mb-6 h-9 w-80 max-w-full" />
      {/* Thanh lọc ngày. Thiếu ô này thì mỗi lần bấm "Áp dụng" trang sẽ tụt lên
          rồi nhảy xuống, vì skeleton thấp hơn nội dung thật đúng một hàng. */}
      <Skeleton className="mb-8 h-32 w-full" />
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </Section>
  );
}
