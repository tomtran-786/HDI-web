"use client";

import { useActionState } from "react";
import { stages } from "@/content/account";
import { saveProfile, type ProfileState } from "./actions";
import { IconArrow } from "@/components/ui/icons";

export function ProfileForm({
  defaultPhone,
  defaultStage,
  next,
}: {
  defaultPhone: string;
  defaultStage: string;
  /** Where to go once the profile is saved — the cart, mid-checkout. */
  next: string;
}) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(
    saveProfile,
    {},
  );

  // After a rejected submit, show what was typed rather than the empty values
  // still sitting in the database.
  const phone = state.phone ?? defaultPhone;
  const stage = state.stage ?? defaultStage;

  return (
    <form action={action} className="rounded-card border border-line bg-card p-6 sm:p-8">
      <input type="hidden" name="tiep" value={next} />

      {state.error && (
        <p
          role="alert"
          className="mb-5 rounded-card border border-line bg-bg-soft px-4 py-3 text-sm text-fg-muted"
        >
          {state.error}
        </p>
      )}

      <label
        htmlFor="phone"
        className="block text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle"
      >
        Số điện thoại
      </label>
      <input
        id="phone"
        name="phone"
        type="tel"
        inputMode="tel"
        required
        key={`phone-${state.phone ?? ""}`}
        defaultValue={phone}
        placeholder="0939 979 890"
        className="mt-2 w-full rounded-card border border-line bg-bg px-4 py-3 text-[15px] text-fg outline-none transition placeholder:text-fg-subtle focus:border-primary"
      />
      <p className="mt-2 text-xs text-fg-subtle">
        Ưu tiên số dùng Zalo — đây là kênh liên hệ chính.
      </p>

      <fieldset className="mt-7">
        <legend className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
          Bạn đang ở giai đoạn nào?
        </legend>
        <div className="mt-3 space-y-2.5">
          {stages.map((s) => (
            <label
              key={s.value}
              className="flex cursor-pointer items-start gap-3 rounded-card border border-line px-4 py-3 transition hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-tint"
            >
              <input
                type="radio"
                name="stage"
                value={s.value}
                required
                defaultChecked={stage === s.value}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
              />
              <span className="text-[15px] leading-snug text-fg">{s.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep disabled:opacity-60"
      >
        {pending ? "Đang lưu…" : "Lưu và tiếp tục"}
        {!pending && <IconArrow size={16} />}
      </button>
    </form>
  );
}
