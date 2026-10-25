import { Skeleton } from "@/components/ui/skeleton";

export default function CartLoading() {
  return (
    <>
      <div className="border-b border-line bg-bg">
        <div className="shell flex items-baseline justify-between py-5">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-14" />
        </div>
      </div>

      <section className="bg-bg">
        <div className="shell py-8 pb-28 sm:py-10 lg:pb-20">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-5">
              {[0, 1].map((row) => (
                <Skeleton key={row} className="h-28" />
              ))}
            </div>
            <Skeleton className="h-80" />
          </div>
        </div>
      </section>
    </>
  );
}
