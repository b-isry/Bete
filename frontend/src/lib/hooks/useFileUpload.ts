"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiError,
  presignUpload,
  type UploadCategory,
} from "@/lib/api";

/**
 * Mirrors CATEGORY_CONFIG in
 * `backend/src/modules/storage/services/storage.service.ts`. Kept in sync so the
 * user gets an instant error instead of a rejected presign round-trip; the
 * backend remains the authority.
 */
const CATEGORY_RULES: Record<
  UploadCategory,
  { contentTypes: readonly string[]; maxBytes: number }
> = {
  PROPERTY_IMAGE: {
    contentTypes: ["image/jpeg", "image/png", "image/webp"],
    maxBytes: 8 * 1024 * 1024,
  },
  ID_DOCUMENT: {
    contentTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ],
    maxBytes: 10 * 1024 * 1024,
  },
  MESSAGE_MEDIA: {
    contentTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "audio/mpeg",
      "audio/ogg",
      "audio/webm",
      "video/mp4",
      "video/webm",
    ],
    maxBytes: 25 * 1024 * 1024,
  },
};

export type UploadStatus = "idle" | "uploading" | "done" | "error";

export type UploadResult = {
  /** Object key stored in the DB for private categories. */
  key: string;
  /** Only present for PROPERTY_IMAGE (public prefix). */
  publicUrl?: string;
  /** SHA-256 hex digest — only computed for PROPERTY_IMAGE. */
  hash?: string;
};

export type UploadErrorCode =
  | "INVALID_TYPE"
  | "TOO_LARGE"
  | "MISSING_EXTENSION"
  | "PRESIGN_FAILED"
  | "UPLOAD_FAILED"
  | "CANCELLED";

export type UseFileUploadState = {
  status: UploadStatus;
  progress: number;
  result: UploadResult | null;
  error: string | null;
  errorCode: UploadErrorCode | null;
};

export type UseFileUpload = UseFileUploadState & {
  upload: (
    file: File,
    category: UploadCategory,
    threadId?: string,
  ) => Promise<UploadResult | null>;
  cancel: () => void;
  reset: () => void;
};

export function formatMaxSize(category: UploadCategory): string {
  return `${Math.round(CATEGORY_RULES[category].maxBytes / (1024 * 1024))}MB`;
}

export function isAllowedFile(file: File, category: UploadCategory): boolean {
  const rules = CATEGORY_RULES[category];
  return rules.contentTypes.includes(file.type) && file.size <= rules.maxBytes;
}

async function sha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * PUT the raw file with XHR rather than fetch — fetch has no upload progress
 * events, and the presigned URL requires the exact Content-Type it was signed
 * with.
 */
function putWithProgress(
  uploadUrl: string,
  file: File,
  onProgress: (percent: number) => void,
  registerXhr: (xhr: XMLHttpRequest | null) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    registerXhr(xhr);

    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      registerXhr(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Storage responded with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      registerXhr(null);
      reject(new Error("Network error while uploading"));
    };

    xhr.onabort = () => {
      registerXhr(null);
      reject(new DOMException("Upload cancelled", "AbortError"));
    };

    xhr.send(file);
  });
}

const INITIAL_STATE: UseFileUploadState = {
  status: "idle",
  progress: 0,
  result: null,
  error: null,
  errorCode: null,
};

/**
 * Presigned-upload flow for a single file: validate -> POST /uploads/presign
 * -> PUT straight to storage with progress. One hook instance per file.
 */
export function useFileUpload(): UseFileUpload {
  const [state, setState] = useState<UseFileUploadState>(INITIAL_STATE);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      xhrRef.current?.abort();
      xhrRef.current = null;
    };
  }, []);

  const safeSetState = useCallback(
    (next: Partial<UseFileUploadState>) => {
      if (!mountedRef.current) return;
      setState((current) => ({ ...current, ...next }));
    },
    [],
  );

  const cancel = useCallback(() => {
    xhrRef.current?.abort();
    xhrRef.current = null;
  }, []);

  const reset = useCallback(() => {
    cancel();
    if (mountedRef.current) {
      setState(INITIAL_STATE);
    }
  }, [cancel]);

  const upload = useCallback(
    async (
      file: File,
      category: UploadCategory,
      threadId?: string,
    ): Promise<UploadResult | null> => {
      const rules = CATEGORY_RULES[category];

      if (!rules.contentTypes.includes(file.type)) {
        safeSetState({
          status: "error",
          progress: 0,
          result: null,
          error: `Unsupported file type${file.type ? ` (${file.type})` : ""}`,
          errorCode: "INVALID_TYPE",
        });
        return null;
      }

      if (file.size > rules.maxBytes) {
        safeSetState({
          status: "error",
          progress: 0,
          result: null,
          error: `File is larger than ${formatMaxSize(category)}`,
          errorCode: "TOO_LARGE",
        });
        return null;
      }

      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      if (!fileExtension || !/^[a-z0-9]{1,5}$/.test(fileExtension)) {
        safeSetState({
          status: "error",
          progress: 0,
          result: null,
          error: "File name is missing a usable extension",
          errorCode: "MISSING_EXTENSION",
        });
        return null;
      }

      safeSetState({
        status: "uploading",
        progress: 0,
        result: null,
        error: null,
        errorCode: null,
      });

      let presigned;
      try {
        presigned = await presignUpload({
          category,
          contentType: file.type,
          fileExtension,
          ...(threadId ? { thread_id: threadId } : {}),
        });
      } catch (err) {
        safeSetState({
          status: "error",
          error:
            err instanceof ApiError
              ? err.message
              : "Could not start the upload",
          errorCode: "PRESIGN_FAILED",
        });
        return null;
      }

      // Hash before the PUT so a listing is never submitted with a live URL
      // but no dedupe hash.
      let hash: string | undefined;
      if (category === "PROPERTY_IMAGE") {
        hash = await sha256Hex(file);
      }

      try {
        await putWithProgress(
          presigned.uploadUrl,
          file,
          (percent) => safeSetState({ progress: percent }),
          (xhr) => {
            xhrRef.current = xhr;
          },
        );
      } catch (err) {
        const cancelled =
          err instanceof DOMException && err.name === "AbortError";
        safeSetState({
          status: "error",
          error: cancelled ? "Upload cancelled" : "Upload failed",
          errorCode: cancelled ? "CANCELLED" : "UPLOAD_FAILED",
        });
        return null;
      }

      const result: UploadResult = {
        key: presigned.key,
        ...(presigned.publicUrl ? { publicUrl: presigned.publicUrl } : {}),
        ...(hash ? { hash } : {}),
      };

      safeSetState({
        status: "done",
        progress: 100,
        result,
        error: null,
        errorCode: null,
      });

      return result;
    },
    [safeSetState],
  );

  return { ...state, upload, cancel, reset };
}
