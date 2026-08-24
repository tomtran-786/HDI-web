"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  submitFeedback,
  type FeedbackState,
} from "@/app/actions/feedback";
import { feedbackCopy, feedbackKindLabel } from "@/content/feedback";
import {
  FEEDBACK_KINDS,
  TITLE_MAX,
  type FeedbackKindInput,
} from "@/lib/feedback-input";
import { MarkdownEditor } from "./markdown-editor";
import { IconBug, IconBulb, IconCheck, IconClose } from "./ui/icons";

export function FeedbackModal({
  signedIn,
  onClose,
}: {
  signedIn: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const [kind, setKind] = useState<FeedbackKindInput>("bug");
  const [state, formAction, pending] = useActionState<FeedbackState, FormData>(
    submitFeedback,
    {},
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="feedback-modal-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="w-[calc(100vw-1.5rem)] max-w-2xl sm:w-[calc(100vw-2rem)]"
    >
      <div className="flex max-h-[85vh] flex-col">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-card px-5 py-4 sm:px-7 sm:py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
              {feedbackCopy.eyebrow}
            </p>
            <h2
              id="feedback-modal-title"
              className="mt-1 text-xl font-bold tracking-tight text-primary sm:text-2xl"
            >
              {feedbackCopy.title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-fg-muted">
              {feedbackCopy.intro}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={feedbackCopy.close}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-fg-muted transition hover:border-primary hover:text-primary"
          >
            <IconClose />
          </button>
        </div>

        {!signedIn ? (
          <div className="px-5 py-7 sm:px-7 sm:py-9">
            <div className="rounded-card border border-line bg-bg-soft p-5 text-center sm:p-7">
              <IconBulb className="mx-auto text-primary" size={30} />
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-fg-muted">
                {feedbackCopy.signedOut}
              </p>
              <Link
                href={`/dang-nhap?tiep=${encodeURIComponent(pathname)}`}
                className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
              >
                {feedbackCopy.signIn}
              </Link>
            </div>
          </div>
        ) : state.saved ? (
          <div className="px-5 py-8 sm:px-7 sm:py-10">
            <div className="rounded-card border border-line bg-bg-soft p-6 text-center sm:p-8">
              <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-tint text-success">
                <IconCheck size={24} />
              </span>
              <h3 className="mt-4 text-lg font-bold tracking-tight text-primary">
                {feedbackCopy.successTitle}
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-fg-muted">
                {feedbackCopy.successBody}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep"
              >
                {feedbackCopy.done}
              </button>
            </div>
          </div>
        ) : (
          <form action={formAction} className="flex min-h-0 flex-1 flex-col">
            <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
              {state.error && (
                <p
                  role="alert"
                  className="rounded-card border border-line bg-bg-soft px-4 py-3 text-sm text-danger"
                >
                  {state.error}
                </p>
              )}

              <fieldset>
                <legend className="mb-2 text-sm font-bold text-fg">
                  {feedbackCopy.kind} <span className="text-danger">*</span>
                </legend>
                <div role="radiogroup" className="grid grid-cols-2 gap-2">
                  {FEEDBACK_KINDS.map((option) => {
                    const active = kind === option;
                    const Icon = option === "bug" ? IconBug : IconBulb;
                    return (
                      <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setKind(option)}
                        className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition ${
                          active
                            ? "bg-primary text-primary-fg"
                            : "border border-line text-fg-muted hover:border-primary hover:text-primary"
                        }`}
                      >
                        <Icon size={17} />
                        {feedbackKindLabel[option]}
                      </button>
                    );
                  })}
                </div>
                <input type="hidden" name="kind" value={kind} />
              </fieldset>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-fg">
                  {feedbackCopy.titleLabel} <span className="text-danger">*</span>
                </span>
                <input
                  name="title"
                  required
                  maxLength={TITLE_MAX}
                  placeholder={feedbackCopy.titlePlaceholder}
                  className="w-full rounded-card border border-line bg-card px-4 py-3 text-[15px] text-fg outline-none transition placeholder:text-fg-subtle focus:border-primary"
                />
              </label>

              <div>
                <p className="mb-2 text-sm font-bold text-fg">
                  {feedbackCopy.bodyLabel} <span className="text-danger">*</span>
                </p>
                <MarkdownEditor name="body" />
              </div>
              <input type="hidden" name="pageUrl" value={pathname} />
            </div>

            <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-line bg-card px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-full border border-line px-6 py-3 text-sm font-bold text-fg-muted transition hover:border-primary hover:text-primary"
              >
                {feedbackCopy.cancel}
              </button>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-bold text-primary-fg transition hover:bg-primary-deep disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? feedbackCopy.submitting : feedbackCopy.submit}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
