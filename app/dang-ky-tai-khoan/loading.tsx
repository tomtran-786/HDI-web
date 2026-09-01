import { Section } from "@/components/ui/section";
import { Skeleton } from "@/components/ui/skeleton";

/** Xem app/dang-nhap/loading.tsx cho lý do các trang xác thực đều có file này. */
export default function RegisterLoading() {
  return (
    <Section soft>
      <div className="mx-auto max-w-md">
        <Skeleton className="mx-auto mb-3 h-3 w-24" />
        <Skeleton className="mx-auto mb-8 h-8 w-48" />
        <div className="rounded-card border border-line bg-card p-6 sm:p-8 space-y-4">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    </Section>
  );
}
