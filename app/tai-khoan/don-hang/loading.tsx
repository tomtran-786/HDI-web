import { AuthShell } from "@/components/auth-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrderListLoading() {
  return (
    <AuthShell>
      <Skeleton className="mb-3 h-3 w-20" />
      <Skeleton className="mb-10 h-9 w-64" />
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </AuthShell>
  );
}
