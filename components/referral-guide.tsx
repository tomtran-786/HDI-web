import { registerPage } from "@/content/auth";
import { referralPage } from "@/content/referral";

/**
 * Chỉ đúng ô mà người bạn được mời phải nhập mã.
 *
 * DỰNG BẰNG MARKUP, KHÔNG PHẢI ẢNH CHỤP MÀN HÌNH. Một tấm ảnh sẽ sai màu ở dark
 * mode, phải kèm thêm một asset, mờ trên màn hình dày điểm ảnh, và lặng lẽ nói
 * dối ngay lần đầu form đăng ký đổi. Bản dựng này lấy nhãn và câu gợi ý từ
 * chính `content/auth.ts` mà trang đăng ký đang dùng, nên nó không thể lệch với
 * form thật quá một lần sửa file.
 *
 * `aria-hidden` cho phần mô phỏng: người dùng trình đọc màn hình đã nghe câu
 * hướng dẫn ở trên rồi, và đọc lại một cái form giả không bấm được chỉ gây rối.
 */
export function ReferralGuide({ code }: { code: string | null }) {
  return (
    <div
      aria-hidden
      className="mt-4 overflow-hidden rounded-card border border-line bg-bg-soft p-4 sm:p-5"
    >
      <div className="rounded-card border border-line bg-card p-4 sm:p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-fg">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-tint text-[11px] font-bold tabular-nums text-primary">
            3
          </span>
          {referralPage.guideStepLabel}
        </p>

        <div className="mt-4 space-y-3">
          {/* Hai ô mờ phía trên chỉ để người xem nhận ra đây là form đăng ký và
              ô mã nằm ở cuối, chứ không phải một ô đứng lẻ ở đâu đó. */}
          {[registerPage.fields.email, registerPage.fields.password].map(
            (label) => (
              <div key={label} className="opacity-40">
                <p className="text-xs font-semibold text-fg-muted">{label}</p>
                <div className="mt-1 h-9 rounded-card border border-line bg-bg" />
              </div>
            ),
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-fg">
                {registerPage.fields.referralCode}
              </p>
              <div className="mt-1 flex h-9 items-center rounded-card border-2 border-primary bg-bg px-3">
                <span className="truncate font-mono text-sm font-bold uppercase tracking-wider text-primary">
                  {code ?? "ABC123"}
                </span>
              </div>
            </div>

            {/* Mũi tên nằm dưới ô trên màn hình hẹp và bên phải ô trên màn hình
                rộng — trỏ sang ngang ở điện thoại thì nó chỉ ra ngoài màn hình. */}
            <p className="flex shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-danger">
              <span className="text-base leading-none sm:hidden">↑</span>
              <span className="hidden text-base leading-none sm:inline">←</span>
              {referralPage.guideMarker}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
