"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { UploadCategory } from "@/lib/api";
import { formatMaxSize, useFileUpload } from "@/lib/hooks/useFileUpload";
import { Icon } from "./Icon";
import { Button } from "./Button";
import { cn } from "./cn";

export type ImageDropzoneStatus = "uploading" | "done" | "error";

export type ImageDropzoneItem = {
  id: string;
  name: string;
  /** Retained so a failed upload can be retried without re-picking the file. */
  file: File | null;
  /** blob: URL for image previews; null for PDFs. */
  previewUrl: string | null;
  status: ImageDropzoneStatus;
  error: string | null;
  /** Public CDN URL — PROPERTY_IMAGE only. */
  image_url?: string;
  /** SHA-256 hex digest — PROPERTY_IMAGE only. */
  image_hash?: string;
  /** Private storage object key — this is what ID_DOCUMENT submits. */
  key?: string;
};

export type ImageDropzoneProps = {
  value: ImageDropzoneItem[];
  onChange: (items: ImageDropzoneItem[]) => void;
  /** PROPERTY_IMAGE renders a gallery grid; ID_DOCUMENT renders a single row. */
  category?: UploadCategory;
  max?: number;
  className?: string;
  label?: string;
  hint?: string;
};

const ACCEPT_BY_CATEGORY: Record<UploadCategory, string> = {
  PROPERTY_IMAGE: "image/jpeg,image/png,image/webp",
  ID_DOCUMENT: "image/jpeg,image/png,image/webp,application/pdf",
  MESSAGE_MEDIA:
    "image/jpeg,image/png,image/webp,audio/mpeg,audio/ogg,audio/webm,video/mp4,video/webm",
};

function itemId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/**
 * Owns one `useFileUpload` instance for one file and starts the upload on mount.
 * Progress stays local so a 100-tick upload never re-renders the parent form.
 */
function UploadTile({
  item,
  category,
  index,
  layout,
  onPatch,
  onRemove,
}: {
  item: ImageDropzoneItem;
  category: UploadCategory;
  index: number;
  layout: "grid" | "row";
  onPatch: (id: string, patch: Partial<ImageDropzoneItem>) => void;
  onRemove: (id: string) => void;
}) {
  const { t } = useLanguage();
  const { upload, cancel, status, progress, error } = useFileUpload();
  const [attempt, setAttempt] = useState(0);
  const startedRef = useRef(-1);

  useEffect(() => {
    const file = item.file;
    if (!file || startedRef.current === attempt) {
      return;
    }
    startedRef.current = attempt;

    async function run(pending: File) {
      const result = await upload(pending, category);
      if (!result) {
        onPatch(item.id, { status: "error" });
        return;
      }
      onPatch(item.id, {
        status: "done",
        error: null,
        key: result.key,
        ...(result.publicUrl ? { image_url: result.publicUrl } : {}),
        ...(result.hash ? { image_hash: result.hash } : {}),
      });
    }

    void run(file);
  }, [attempt, item.file, item.id, category, upload, onPatch]);

  // The hook is the source of truth for a live upload; `item.status` only
  // catches up once the upload settles.
  const failed = status === "error";
  const busy = status === "uploading" || status === "idle";

  const progressBar = (
    <div className="h-1 w-full bg-surface-container-highest">
      <div
        className="h-full bg-primary-container transition-[width]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );

  const retryButton = (
    <button
      type="button"
      onClick={() => setAttempt((n) => n + 1)}
      className="border border-outline-variant bg-surface px-2 py-1 font-sans text-label-sm uppercase tracking-widest text-primary hover:bg-surface-container-low"
    >
      {t("upload.retry")}
    </button>
  );

  const removeButton = (
    <button
      type="button"
      aria-label={t("listings.new.dropzone.removeA11y").replace(
        "{name}",
        item.name,
      )}
      onClick={() => {
        cancel();
        onRemove(item.id);
      }}
      className="flex h-8 w-8 items-center justify-center border border-outline-variant bg-surface text-on-surface hover:bg-error-container"
    >
      <Icon name={busy ? "stop" : "close"} className="text-base" />
    </button>
  );

  if (layout === "row") {
    return (
      <li className="border border-outline-variant bg-surface-container-lowest">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Icon
              name={item.previewUrl ? "image" : "picture_as_pdf"}
              className={failed ? "text-error" : "text-secondary"}
            />
            <div className="min-w-0">
              <p className="truncate font-sans text-label-md text-on-surface">
                {item.name}
              </p>
              <p className="font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
                {failed
                  ? (error ?? t("upload.failed"))
                  : busy
                    ? `${t("upload.uploading")} ${progress}%`
                    : t("upload.done")}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {failed ? retryButton : null}
            {removeButton}
          </div>
        </div>
        {busy ? progressBar : null}
      </li>
    );
  }

  return (
    <li className="relative aspect-square border border-outline-variant bg-surface-container-highest">
      {item.previewUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={item.previewUrl}
          alt={item.name}
          className={cn(
            "h-full w-full object-cover",
            busy && "opacity-60",
            failed && "opacity-40",
          )}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Icon name="picture_as_pdf" className="text-3xl text-outline" />
        </div>
      )}

      <span className="absolute left-1 top-1 bg-primary-container px-1.5 py-0.5 font-sans text-label-sm uppercase tracking-widest text-on-primary">
        {index + 1}
      </span>

      <div className="absolute right-1 top-1">{removeButton}</div>

      {busy ? (
        <div className="absolute inset-x-0 bottom-0 bg-surface/90 px-2 py-1.5">
          <p className="mb-1 font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
            {progress}%
          </p>
          {progressBar}
        </div>
      ) : null}

      {failed ? (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-error-container/95 px-2 py-1.5">
          <span className="truncate font-sans text-label-sm text-on-surface">
            {error ?? t("upload.failed")}
          </span>
          {retryButton}
        </div>
      ) : null}
    </li>
  );
}

/**
 * Sharp-corner uploader wired to the presigned-upload flow.
 * PROPERTY_IMAGE emits `image_url` + `image_hash`; ID_DOCUMENT emits the
 * private `key` (never a public URL).
 */
export function ImageDropzone({
  value,
  onChange,
  category = "PROPERTY_IMAGE",
  max = 10,
  className,
  label,
  hint,
}: ImageDropzoneProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  const isDocument = category === "ID_DOCUMENT";
  const effectiveMax = isDocument ? 1 : max;
  const remaining = Math.max(0, effectiveMax - value.length);
  const resolvedLabel = label ?? t("listings.new.fields.photos");
  const resolvedHint = hint ?? t("listings.new.photosHint");

  // Tiles receive stable callbacks that read the latest list through refs, so a
  // parent re-render never restarts an in-flight upload effect.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  /**
   * Writes through `valueRef` synchronously as well as calling `onChange`, so
   * two uploads settling in the same tick don't both build on a stale array and
   * lose one result.
   */
  const commit = useCallback((next: ImageDropzoneItem[]) => {
    valueRef.current = next;
    onChangeRef.current(next);
  }, []);

  const onPatch = useCallback(
    (id: string, patch: Partial<ImageDropzoneItem>) => {
      commit(
        valueRef.current.map((entry) =>
          entry.id === id ? { ...entry, ...patch } : entry,
        ),
      );
    },
    [commit],
  );

  const onRemove = useCallback(
    (id: string) => {
      const target = valueRef.current.find((entry) => entry.id === id);
      if (target?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(target.previewUrl);
      }
      commit(valueRef.current.filter((entry) => entry.id !== id));
    },
    [commit],
  );

  function addFiles(fileList: FileList | null) {
    if (!fileList || remaining === 0) return;

    const next = Array.from(fileList)
      .slice(0, remaining)
      .map<ImageDropzoneItem>((file) => ({
        id: itemId(file),
        name: file.name,
        file,
        previewUrl: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
        status: "uploading",
        error: null,
      }));

    if (next.length === 0) return;
    commit([...valueRef.current, ...next]);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  }

  function onInput(e: ChangeEvent<HTMLInputElement>) {
    addFiles(e.target.files);
    e.target.value = "";
  }

  const prompt = isDocument
    ? t("upload.documentPrompt").replace("{max}", formatMaxSize(category))
    : t("listings.new.dropzone.prompt").replace(
        "{remaining}",
        String(remaining),
      );

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <p className="mb-1 font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
          {resolvedLabel}
        </p>
        <p className="font-body text-body-md text-on-surface-variant">
          {resolvedHint}
        </p>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="flex flex-col items-center justify-center gap-3 border border-dashed border-outline-variant bg-surface-container-low px-6 py-10 text-center"
      >
        <Icon
          name={isDocument ? "upload_file" : "add_photo_alternate"}
          className="text-4xl text-outline"
        />
        <p className="font-body text-body-md text-on-surface-variant">
          {prompt}
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={remaining === 0}
          onClick={() => inputRef.current?.click()}
        >
          {isDocument
            ? t("upload.chooseDocument")
            : t("listings.new.dropzone.choose")}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_BY_CATEGORY[category]}
          multiple={effectiveMax > 1}
          className="hidden"
          onChange={onInput}
        />
      </div>

      {value.length > 0 ? (
        <ul
          className={cn(
            isDocument
              ? "space-y-2"
              : "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5",
          )}
        >
          {value.map((item, index) => (
            <UploadTile
              key={item.id}
              item={item}
              index={index}
              category={category}
              layout={isDocument ? "row" : "grid"}
              onPatch={onPatch}
              onRemove={onRemove}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
