import { Section } from "@/components/ui/section";
import { Skeleton } from "@/components/ui/skeleton";

export default function ServiceOrderResultLoading() {
  return (
    <Section soft>
      <Skeleton className="mb-3 h-3 w-24" />
      <Skeleton className="mb-10 h-9 w-80 max-w-full" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </Section>
  );
}
