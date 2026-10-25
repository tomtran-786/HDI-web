"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { certificate } from "@/content/certificate";
import { IconClose } from "./ui/icons";

const { image, zoom } = certificate;

/**
 * Ảnh mẫu giấy chứng nhận; bấm vào mở bản lớn trong `<dialog>` gốc theo đúng
 * mẫu components/feedback-modal.tsx (Esc, focus trap, bấm nền để đóng, trả
 * focus về nút ảnh khi đóng đều là của trình duyệt).
 */
export function CertificateViewer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={zoom.open}
        className="block w-full cursor-zoom-in overflow-hidden rounded-card"
      >
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes="(min-width: 1024px) 40rem, 100vw"
          className="h-auto w-full"
        />
      </button>
      {open && <CertificateDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function CertificateDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-label={zoom.dialogTitle}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="w-[calc(100vw-1.5rem)] max-w-5xl sm:w-[calc(100vw-2rem)]"
    >
      <div className="relative">
        <button
          type="button"
          onClick={onClose}
          aria-label={zoom.close}
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card text-fg-muted shadow-sm transition hover:border-primary hover:text-primary"
        >
          <IconClose />
        </button>
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes="(min-width: 1024px) 64rem, 100vw"
          className="h-auto w-full"
        />
      </div>
    </dialog>
  );
}
