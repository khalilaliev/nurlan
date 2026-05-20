"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ImagePlus, X, Loader2, AlertCircle, Play, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  ACCEPT_ATTR,
  MAX_FILES_PER_STORY,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  STORAGE_BUCKET,
  buildStoragePath,
  formatBytes,
  kindForUrl,
  validateFile,
  type MediaKind,
  type ValidationError,
} from "@/lib/media/constants";
import { detectMagic, readFirstBytes } from "@/lib/media/magic-bytes";

function errorTranslationKey(
  err: ValidationError | "errorUpload",
): "mediaErrorType" {
  return `media${err.charAt(0).toUpperCase()}${err.slice(1)}` as "mediaErrorType";
}

export type UploadedMedia = {
  url: string;
  storagePath: string;
  kind: MediaKind;
};

type Item = {
  id: string;
  kind: MediaKind;
  // For pending uploads
  file?: File;
  previewUrl?: string;
  status: "uploading" | "done" | "error";
  errorKey?: ValidationError | "errorUpload";
  storagePath?: string;
  publicUrl?: string;
};

function makeId() {
  return Math.random().toString(36).slice(2);
}

export function MediaUploader({
  userId,
  initial,
  onChange,
  onErrorChange,
  maxFiles = MAX_FILES_PER_STORY,
}: {
  userId: string;
  initial: UploadedMedia[];
  onChange: (media: UploadedMedia[]) => void;
  onErrorChange?: (hasErrors: boolean) => void;
  maxFiles?: number;
}) {
  const t = useTranslations("submit");
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>(() =>
    initial.map((m) => ({
      id: makeId(),
      kind: m.kind,
      status: "done" as const,
      storagePath: m.storagePath,
      publicUrl: m.url,
    })),
  );
  const [dragging, setDragging] = useState(false);

  // Push successful uploads up to the parent whenever items change. Also
  // report whether any item is in an error state so the form can disable
  // submit until the user removes the offending tile(s).
  useEffect(() => {
    const done: UploadedMedia[] = items
      .filter(
        (i): i is Item & { status: "done"; publicUrl: string; storagePath: string } =>
          i.status === "done" &&
          typeof i.publicUrl === "string" &&
          typeof i.storagePath === "string",
      )
      .map((i) => ({
        url: i.publicUrl,
        storagePath: i.storagePath,
        kind: i.kind,
      }));
    onChange(done);
    onErrorChange?.(items.some((i) => i.status === "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // Clean up object URLs on unmount.
  useEffect(() => {
    return () => {
      items.forEach((i) => {
        if (i.previewUrl) URL.revokeObjectURL(i.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Single source of truth used by BOTH drag-drop and file picker.
  // Each file goes through three checks before it's allowed to upload:
  //   1. MIME type     (validateFile)
  //   2. File extension (validateFile)
  //   3. Magic bytes   (this function, async)
  // Only files that pass all three reach the storage layer.
  const accept = async (files: FileList | File[]) => {
    const remaining = maxFiles - items.filter((i) => i.status !== "error").length;
    const accepted: Item[] = [];
    let rejectedMax = false;

    for (const file of Array.from(files)) {
      if (accepted.length >= remaining) {
        rejectedMax = true;
        break;
      }
      const result = validateFile(file);
      if (!result.ok) {
        accepted.push({
          id: makeId(),
          kind: result.kind ?? "image",
          file,
          status: "error",
          errorKey: result.error,
        });
        continue;
      }
      // Magic-byte check: the actual file signature must agree with the
      // claimed kind. This catches renamed files (e.g. EXE → .jpg).
      let signatureMatches = false;
      try {
        const bytes = await readFirstBytes(file, 16);
        const detected = detectMagic(bytes);
        if (result.kind === "image" && detected === "image") signatureMatches = true;
        if (result.kind === "video" && detected === "video") signatureMatches = true;
      } catch {
        signatureMatches = false;
      }
      if (!signatureMatches) {
        accepted.push({
          id: makeId(),
          kind: result.kind,
          file,
          status: "error",
          errorKey: "errorBadSignature",
        });
        continue;
      }
      accepted.push({
        id: makeId(),
        kind: result.kind,
        file,
        previewUrl: URL.createObjectURL(file),
        status: "uploading",
      });
    }

    if (rejectedMax) {
      accepted.push({
        id: makeId(),
        kind: "image",
        status: "error",
        errorKey: "errorMaxFiles",
      });
    }

    setItems((prev) => [...prev, ...accepted]);

    accepted.forEach((item) => {
      if (item.status === "uploading" && item.file) {
        void uploadOne(item.id, item.file);
      }
    });
  };

  const uploadOne = async (id: string, file: File) => {
    const supabase = createSupabaseBrowserClient();
    const path = buildStoragePath(userId, file.name);

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, status: "error", errorKey: "errorUpload" } : i,
        ),
      );
      return;
    }

    const { data: pub } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);

    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              status: "done",
              storagePath: path,
              publicUrl: pub.publicUrl,
            }
          : i,
      ),
    );
  };

  const remove = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);

      // Best-effort delete from storage if it was uploaded
      if (item?.storagePath) {
        const supabase = createSupabaseBrowserClient();
        void supabase.storage.from(STORAGE_BUCKET).remove([item.storagePath]);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const retry = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item?.file) return prev;
      void uploadOne(id, item.file);
      return prev.map((i) =>
        i.id === id
          ? { ...i, status: "uploading" as const, errorKey: undefined }
          : i,
      );
    });
  };

  const activeCount = items.filter((i) => i.status !== "error").length;
  const canAddMore = activeCount < maxFiles;

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void accept(e.target.files);
          e.target.value = "";
        }}
      />

      {canAddMore && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files.length > 0) void accept(e.dataTransfer.files);
          }}
          className={cn(
            "w-full rounded-[var(--radius-lg)] border-2 border-dashed transition-all flex flex-col items-center justify-center py-8 px-4 text-center gap-2 cursor-pointer",
            dragging
              ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]/30"
              : "border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-elevated)]/40",
          )}
        >
          <div className="h-10 w-10 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center">
            <ImagePlus className="h-5 w-5 text-[var(--color-accent)]" />
          </div>
          <p className="text-sm font-medium">
            {t("mediaHint", { max: maxFiles })}
          </p>
          <p className="text-xs text-[var(--color-foreground-subtle)]">
            {t("mediaSizes", {
              img: formatBytes(MAX_IMAGE_SIZE),
              vid: formatBytes(MAX_VIDEO_SIZE),
            })}
          </p>
        </button>
      )}

      {items.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {items.map((item) => (
            <li key={item.id}>
              <Tile item={item} onRemove={() => remove(item.id)} onRetry={() => retry(item.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Tile({
  item,
  onRemove,
  onRetry,
}: {
  item: Item;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const t = useTranslations("submit");
  const src = item.publicUrl ?? item.previewUrl;

  if (item.status === "error" && !item.file) {
    // Top-level error (e.g. errorMaxFiles)
    return (
      <div className="relative aspect-square rounded-[var(--radius-lg)] border border-[var(--color-accent)]/40 bg-[var(--color-accent-soft)]/30 p-3 flex flex-col items-center justify-center text-center gap-2">
        <AlertCircle className="h-5 w-5 text-[var(--color-accent)]" />
        <p className="text-xs text-[var(--color-accent)] leading-snug">
          {item.errorKey && t(errorTranslationKey(item.errorKey))}
        </p>
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center hover:bg-black/70"
          aria-label={t("mediaRemove")}
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="group relative aspect-square rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
      {src && item.kind === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
        />
      )}
      {src && item.kind === "video" && (
        <>
          <video
            src={src}
            className="h-full w-full object-cover"
            muted
            playsInline
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="h-10 w-10 rounded-full bg-black/60 backdrop-blur flex items-center justify-center">
              <Play className="h-4 w-4 text-white fill-white ml-0.5" />
            </div>
          </div>
        </>
      )}

      {item.status === "uploading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-1.5 text-white">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-[10px] uppercase tracking-wider font-medium">
              {t("mediaUploading")}
            </span>
          </div>
        </div>
      )}

      {item.status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-accent-soft)]/80 backdrop-blur-sm p-3 text-center gap-2">
          <AlertCircle className="h-5 w-5 text-[var(--color-accent)]" />
          <p className="text-xs font-medium text-[var(--color-accent)] leading-snug">
            {item.errorKey && t(errorTranslationKey(item.errorKey))}
          </p>
          {item.file && (
            <button
              type="button"
              onClick={onRetry}
              className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-accent)] hover:underline flex items-center gap-1"
            >
              <RotateCw className="h-3 w-3" />
              {t("mediaRetry")}
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-black/60 backdrop-blur text-white flex items-center justify-center hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        aria-label={t("mediaRemove")}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// Helper: convert URL-only list (e.g. from a draft) into UploadedMedia shape.
export function urlsToMedia(urls: string[]): UploadedMedia[] {
  return urls
    .filter((u): u is string => typeof u === "string" && u.length > 0)
    .map((url) => ({
      url,
      storagePath: "",
      kind: kindForUrl(url),
    }));
}
