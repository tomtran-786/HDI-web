import { AuthShell } from "@/components/auth-shell";
import { Skeleton } from "@/components/ui/skeleton";

/** Xem app/dang-nhap/loading.tsx cho lý do các trang xác thực đều có file này. */
export default function ForgotPasswordLoading() {
  return (
    <AuthShell>
      <div className="mx-auto max-w-md">
        <Skeleton className="mb-8 h-8 w-48" />
        <div className="rounded-card border border-line bg-card p-6 sm:p-8">
          <Skeleton className="mb-4 h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    </AuthShell>
  );
}
