"use client";

import { Icon } from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";

export type MessageAttachmentProps = {
  /** Already a presigned GET URL — the API resolves private keys on read. */
  url: string;
  messageType: string;
};

/**
 * Renders a message attachment. Private keys are resolved server-side, so a
 * raw `private/...` value here means the API did not presign it.
 */
export function MessageAttachment({ url, messageType }: MessageAttachmentProps) {
  const { t } = useLanguage();

  if (url.startsWith("private/")) {
    return (
      <span className="inline-flex items-center gap-2 font-sans text-label-sm uppercase tracking-widest">
        <Icon name="lock" className="text-base" />
        {t("upload.attachmentUnavailable")}
      </span>
    );
  }

  if (messageType === "VIDEO") {
    return (
      <video
        controls
        src={url}
        className="mt-1 max-h-64 w-full border border-outline-variant"
      />
    );
  }

  if (messageType === "VOICE") {
    return <audio controls src={url} className="mt-1 w-full" />;
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" className="block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={t("upload.attachmentAlt")}
        className="mt-1 max-h-64 w-full border border-outline-variant object-cover"
      />
    </a>
  );
}
