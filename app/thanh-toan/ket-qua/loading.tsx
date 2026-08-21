import { Section } from "@/components/ui/section";
import { Skeleton } from "@/components/ui/skeleton";

export default function PaymentResultLoading() {
  return (
    <Section soft>
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <Skeleton className="mx-auto h-3 w-16" />
        <Skeleton className="mx-auto h-9 w-80 max-w-full" />
        <Skeleton className="mx-auto h-11 w-40" />
      </div>
    </Section>
  );
}
