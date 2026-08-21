import { Section } from "@/components/ui/section";
import { Skeleton } from "@/components/ui/skeleton";

export default function EnrolLoading() {
  return (
    <Section soft>
      <Skeleton className="mb-3 h-3 w-20" />
      <Skeleton className="mb-10 h-9 w-72" />
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </Section>
  );
}
