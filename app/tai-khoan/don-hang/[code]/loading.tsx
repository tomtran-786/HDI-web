import { Section } from "@/components/ui/section";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrderDetailLoading() {
  return (
    <Section soft>
      <Skeleton className="mb-3 h-3 w-20" />
      <Skeleton className="mb-10 h-9 w-56" />
      <div className="mx-auto max-w-2xl space-y-5">
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </Section>
  );
}
