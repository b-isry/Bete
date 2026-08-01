"use client";

import { useRef, type DragEvent, type ChangeEvent } from "react";
import { Icon } from "./Icon";
import { Button } from "./Button";
import { cn } from "./cn";

export type ImageDropzoneItem = {
  id: string;
  previewUrl: string;
  image_url: string;
  image_hash: string;
  name: string;
};

export type ImageDropzoneProps = {
  value: ImageDropzoneItem[];
  onChange: (items: ImageDropzoneItem[]) => void;
  max?: number;
  className?: string;
  label?: string;
  hint?: string;
};

async function hashBytes(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

async function fileToItem(file: File): Promise<ImageDropzoneItem> {
  const buffer = await file.arrayBuffer();
  const image_hash = await hashBytes(buffer);
  const previewUrl = URL.createObjectURL(file);
  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    previewUrl,
    image_url: previewUrl,
    image_hash,
    name: file.name,
  };
}

/** Sharp-corner image picker — max 10, editorial dashed stroke (same as EmptyState). */
export function ImageDropzone({
  value,
  onChange,
  max = 10,
  className,
  label = "Photos",
  hint = "Up to 10 images. JPEG or PNG.",
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const remaining = Math.max(0, max - value.length);

  async function addFiles(fileList: FileList | null) {
    if (!fileList || remaining === 0) return;
    const files = Array.from(fileList)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, remaining);
    const next = await Promise.all(files.map(fileToItem));
    onChange([...value, ...next]);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    void addFiles(e.dataTransfer.files);
  }

  function onInput(e: ChangeEvent<HTMLInputElement>) {
    void addFiles(e.target.files);
    e.target.value = "";
  }

  function removeAt(id: string) {
    const target = value.find((v) => v.id === id);
    if (target?.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(target.previewUrl);
    }
    onChange(value.filter((v) => v.id !== id));
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <p className="mb-1 font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
          {label}
        </p>
        <p className="font-body text-body-md text-on-surface-variant">{hint}</p>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="flex flex-col items-center justify-center gap-3 border border-dashed border-outline-variant bg-surface-container-low px-6 py-10 text-center"
      >
        <Icon name="add_photo_alternate" className="text-4xl text-outline" />
        <p className="font-body text-body-md text-on-surface-variant">
          Drag photos here, or choose files ({remaining} remaining)
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={remaining === 0}
          onClick={() => inputRef.current?.click()}
        >
          Choose images
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={max > 1}
          className="hidden"
          onChange={onInput}
        />
      </div>

      {value.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {value.map((item, index) => (
            <li
              key={item.id}
              className="group relative aspect-square overflow-hidden border border-outline-variant bg-surface-container-highest"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.previewUrl}
                alt={item.name}
                className="h-full w-full object-cover"
              />
              <span className="absolute left-1 top-1 bg-primary-container px-1.5 py-0.5 font-sans text-label-sm uppercase tracking-widest text-on-primary">
                {index + 1}
              </span>
              <button
                type="button"
                aria-label={`Remove ${item.name}`}
                onClick={() => removeAt(item.id)}
                className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center border border-outline-variant bg-surface text-on-surface hover:bg-error-container"
              >
                <Icon name="close" className="text-base" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
