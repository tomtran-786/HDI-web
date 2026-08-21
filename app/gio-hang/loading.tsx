import { Section } from "@/components/ui/section";
import { Skeleton } from "@/components/ui/skeleton";

export default function CartLoading() {
  return (
    <Section soft>
      <Skeleton className="mb-3 h-3 w-20" />
      <Skeleton className="mb-10 h-9 w-64" />
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="mt-8 h-32 w-full" />
    </Section>
  );
}
