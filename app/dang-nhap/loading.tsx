import { Section } from "@/components/ui/section";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Chỉ hiện lúc ĐIỀU HƯỚNG vào trang này (bấm Link, hoặc sau khi một Server
 * Action redirect tới đây) — không tự hiện trong lúc form trên trang khác đang
 * gửi. Xem `components/ui/submit-button.tsx` để biết vì sao đây vẫn cần thiết:
 * kết nối database nguội có thể khiến cả cú nhảy trang này chậm vài giây.
 */
export default function SignInLoading() {
  return (
    <Section soft>
      <div className="mx-auto max-w-md">
        <Skeleton className="mx-auto mb-3 h-3 w-24" />
        <Skeleton className="mx-auto mb-8 h-8 w-48" />
        <div className="rounded-card border border-line bg-card p-6 sm:p-8">
          <Skeleton className="mb-4 h-11 w-full" />
          <Skeleton className="mb-6 h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    </Section>
  );
}
