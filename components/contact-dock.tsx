"use client";

import { useEffect, useRef, useState } from "react";
import { contactDock } from "@/content/site";
import { feedbackCopy } from "@/content/feedback";
import { trackCta } from "@/lib/analytics";
import { FeedbackModal } from "./feedback-modal";
import {
  IconBulb,
  IconClose,
  IconFacebook,
  IconMail,
  IconMessage,
  IconPhone,
} from "./ui/icons";

const channelIcons = {
  zalo: IconMessage,
  phone: IconPhone,
  email: IconMail,
  fanpage: IconFacebook,
};

const channelToneClasses = {
  primary: "bg-primary text-primary-fg",
  success: "bg-tint text-success",
  cool: "bg-tint text-primary",
};

function FeedbackBubbleButton({
  onClick,
  showLabel,
}: {
  onClick: () => void;
  showLabel: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      {showLabel && (
        <span className="rounded-full border border-line bg-card px-3 py-1.5 text-xs font-bold text-fg shadow-md">
          {feedbackCopy.bubble}
        </span>
      )}
      <button
        type="button"
        aria-label={feedbackCopy.bubbleAria}
        onClick={() => {
          trackCta("bubble-gop-y", "gop-y");
          onClick();
        }}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-card text-primary shadow-lg transition hover:-translate-y-0.5 hover:border-primary"
      >
        <IconBulb size={20} />
      </button>
    </div>
  );
}

export function ContactDock({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);
  const channels = contactDock.filter((channel) => channel.href !== null);

  useEffect(() => {
    if (!open) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function closeOutside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !dockRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutside);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOutside);
    };
  }, [open]);

  return (
    <>
      <div
        ref={dockRef}
        data-contact-dock
        className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6"
      >
      <ul
        aria-hidden={!open}
        className={`flex flex-col items-end gap-2 ${open ? "" : "pointer-events-none"}`}
      >
        {channels.map((channel, index) => {
          const Icon = channelIcons[channel.key];
          return (
            <li
              key={channel.key}
              className={`flex items-center justify-end gap-2 transition duration-200 ${
                open
                  ? "translate-x-0 opacity-100"
                  : "translate-x-3 opacity-0"
              }`}
              style={{ transitionDelay: `${index * 45}ms` }}
            >
              <span className="rounded-full border border-line bg-card px-3 py-1.5 text-xs font-bold text-fg shadow-md">
                {channel.label}
              </span>
              <a
                href={channel.href}
                target={channel.target ?? undefined}
                rel={channel.target ? "noopener noreferrer" : undefined}
                tabIndex={open ? 0 : -1}
                aria-label={`${channel.label}: ${channel.value}`}
                onClick={() => trackCta("bubble-lien-he", channel.key)}
                className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line shadow-lg transition hover:-translate-y-0.5 hover:border-primary ${channelToneClasses[channel.tone]}`}
              >
                <Icon size={20} />
              </a>
            </li>
          );
        })}
      </ul>

      <FeedbackBubbleButton
        showLabel={open}
        onClick={() => setFeedbackOpen(true)}
      />

      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? "Đóng các kênh liên hệ" : "Mở các kênh liên hệ"}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-fg shadow-[0_10px_28px_-8px_rgba(12,73,143,0.7)] transition hover:-translate-y-0.5 hover:bg-primary-deep"
      >
        {open ? <IconClose size={23} /> : <IconMessage size={23} />}
      </button>
      </div>
      {feedbackOpen && (
        <FeedbackModal
          signedIn={signedIn}
          onClose={() => setFeedbackOpen(false)}
        />
      )}
    </>
  );
}
