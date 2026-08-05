"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Button, Icon, Input } from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatMaxSize, useFileUpload } from "@/lib/hooks/useFileUpload";

export type ComposerMessageType = "TEXT" | "IMAGE" | "VIDEO" | "VOICE";

export type ComposerPayload = {
  message_type: ComposerMessageType;
  message_text?: string;
  /** Private storage object key — resolved to a presigned URL on read. */
  media_url?: string;
};

export type MessageComposerProps = {
  /** Attachments need a thread to authorize against, so the button is disabled without one. */
  threadId: string | null;
  onSend: (payload: ComposerPayload) => Promise<void>;
  placeholder?: string;
  className?: string;
};

const ATTACHMENT_ACCEPT =
  "image/jpeg,image/png,image/webp,audio/mpeg,audio/ogg,audio/webm,video/mp4,video/webm";

function messageTypeFor(file: File): ComposerMessageType {
  if (file.type.startsWith("video/")) return "VIDEO";
  if (file.type.startsWith("audio/")) return "VOICE";
  return "IMAGE";
}

export function MessageComposer({
  threadId,
  onSend,
  placeholder,
  className,
}: MessageComposerProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const { upload, cancel, reset, status, progress, result, error } =
    useFileUpload();

  const uploading = status === "uploading";
  const failed = status === "error";
  const attachmentReady = status === "done" && result !== null;

  function clearAttachment() {
    cancel();
    reset();
    setAttachment(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function startUpload(file: File) {
    setAttachment(file);
    if (!threadId) return;
    await upload(file, "MESSAGE_MEDIA", threadId);
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    void startUpload(file);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();

    if (uploading) return;
    if (!text && !attachmentReady) return;

    const payload: ComposerPayload =
      attachmentReady && attachment && result
        ? {
            message_type: messageTypeFor(attachment),
            media_url: result.key,
            ...(text ? { message_text: text } : {}),
          }
        : { message_type: "TEXT", message_text: text };

    setSending(true);
    try {
      await onSend(payload);
      setDraft("");
      clearAttachment();
    } catch {
      // The caller surfaces the failure; keep the draft and attachment so the
      // user can retry without re-picking the file.
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      className={className}
      onSubmit={(e) => {
        void submit(e);
      }}
    >
      {attachment ? (
        <div className="mb-3 border border-outline-variant bg-surface-container-lowest">
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <Icon
                name={failed ? "error" : "attach_file"}
                className={failed ? "text-error" : "text-secondary"}
              />
              <span className="truncate font-sans text-label-md text-on-surface">
                {attachment.name}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
                {failed
                  ? (error ?? t("upload.failed"))
                  : uploading
                    ? `${progress}%`
                    : t("upload.attachmentReady")}
              </span>
              {failed ? (
                <button
                  type="button"
                  onClick={() => {
                    void startUpload(attachment);
                  }}
                  className="border border-outline-variant bg-surface px-2 py-1 font-sans text-label-sm uppercase tracking-widest text-primary hover:bg-surface-container-low"
                >
                  {t("upload.retry")}
                </button>
              ) : null}
              <button
                type="button"
                aria-label={t("upload.remove")}
                onClick={clearAttachment}
                className="flex h-8 w-8 items-center justify-center border border-outline-variant bg-surface text-on-surface hover:bg-error-container"
              >
                <Icon name="close" className="text-base" />
              </button>
            </div>
          </div>
          {uploading ? (
            <div className="h-1 w-full bg-surface-container-highest">
              <div
                className="h-full bg-primary-container transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="icon"
          aria-label={t("upload.attach")}
          title={
            threadId
              ? `${t("upload.attach")} (${formatMaxSize("MESSAGE_MEDIA")})`
              : t("upload.attachNeedsThread")
          }
          disabled={!threadId || uploading || sending}
          onClick={() => inputRef.current?.click()}
        >
          <Icon name="attach_file" />
        </Button>
        <Input
          variant="stroke"
          className="flex-1"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
        />
        <Button
          type="submit"
          variant="primary"
          className="gap-2"
          disabled={
            sending || uploading || (!draft.trim() && !attachmentReady)
          }
        >
          <Icon name="send" />
          {t("dashboard.messages.send")}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ATTACHMENT_ACCEPT}
          className="hidden"
          onChange={onPick}
        />
      </div>
    </form>
  );
}
