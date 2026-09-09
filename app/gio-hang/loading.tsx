import { PageBackdrop } from "@/components/page-backdrop";
import { Skeleton } from "@/components/ui/skeleton";

export default function CartLoading() {
  return (
    <>
      <PageBackdrop>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-10 w-48" />
        <Skeleton className="mt-3 h-5 w-full max-w-md" />
      </PageBackdrop>

      <section className="border-t border-line bg-bg">
        <div className="shell py-10 pb-28 sm:py-14 lg:pb-14">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-2">
              {[0, 1, 2].map((row) => (
                <Skeleton key={row} className="h-20" />
              ))}
            </div>
            <Skeleton className="h-80" />
          </div>
        </div>
      </section>
    </>
  );
}
