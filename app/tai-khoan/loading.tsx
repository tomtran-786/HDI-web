import { Section } from "@/components/ui/section";
import { Skeleton } from "@/components/ui/skeleton";

export default function AccountLoading() {
  return (
    <Section soft>
      <Skeleton className="mb-3 h-3 w-28" />
      <Skeleton className="mb-10 h-9 w-72 max-w-full" />
      <div className="grid gap-5 md:grid-cols-2">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-32 w-full md:col-span-2" />
      </div>
    </Section>
  );
}
