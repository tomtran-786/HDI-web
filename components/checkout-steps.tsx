import { checkoutSteps } from "@/content/checkout";
import { IconCheck } from "@/components/ui/icons";

/**
 * Ties dang-ky → gio-hang → thanh-toan/ket-qua → don-hang/[code] together as
 * one visible flow. Collapses to plain "Bước n/4" text under `sm:` so it
 * never forces horizontal scroll on a 375px screen.
 */
export function CheckoutSteps({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    // `inline-block` so a page that centers its heading (text-align) centers
    // this too, without a `justify-center` that would fight left-aligned pages.
    <div className="mb-8 inline-block">
      <p className="text-[13px] font-semibold text-fg-subtle sm:hidden">
        Bước {current}/{checkoutSteps.length} · {checkoutSteps[current - 1]}
      </p>
      <ol className="hidden items-center sm:flex">
        {checkoutSteps.map((label, i) => {
          const step = i + 1;
          const done = step < current;
          const active = step === current;
          return (
            <li key={label} className="flex items-center">
              <span className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    active
                      ? "bg-primary text-primary-fg"
                      : done
                        ? "bg-tint text-primary"
                        : "border border-line text-fg-subtle"
                  }`}
                >
                  {done ? <IconCheck size={12} /> : step}
                </span>
                <span
                  className={`text-[13px] font-semibold ${
                    active ? "text-fg" : "text-fg-subtle"
                  }`}
                >
                  {label}
                </span>
              </span>
              {step < checkoutSteps.length && (
                <span aria-hidden className="mx-3 h-px w-8 bg-line" />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
