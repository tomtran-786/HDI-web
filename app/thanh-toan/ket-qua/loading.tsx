import { Skeleton } from "@/components/ui/skeleton";

export default function PaymentResultLoading() {
  return (
    <>
      <div className="border-b border-line bg-bg">
        <div className="shell flex items-baseline justify-between py-5">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <section className="bg-bg">
        <div className="shell py-8 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-5">
              <Skeleton className="h-20" />
              <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-72" />
          </div>
        </div>
      </section>
    </>
  );
}
