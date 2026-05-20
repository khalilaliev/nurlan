"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { STORAGE_BUCKET, buildStoragePath } from "@/lib/media/constants";
import { detectMagic, readFirstBytes } from "@/lib/media/magic-bytes";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp"];
const ALLOWED_MAGIC = new Set(["image", "png", "webp"]);

function getExtension(name: string): string {
  const lower = name.toLowerCase();
  const idx = lower.lastIndexOf(".");
  return idx < 0 ? "" : lower.slice(idx + 1);
}

type ErrKey = "avatarErrorType" | "avatarErrorSize" | "avatarErrorUpload";

export function AvatarUploader({
  userId,
  username,
  initialUrl,
  onChange,
}: {
  userId: string;
  username: string;
  initialUrl: string | null;
  onChange: (url: string | null) => void;
}) {
  const t = useTranslations("account.settings");
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl);
  const [submittedUrl, setSubmittedUrl] = useState<string | null>(initialUrl);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<ErrKey | null>(null);

  // Object URL needs revocation when it's replaced or on unmount.
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const initial = (username || "?").slice(0, 1).toUpperCase();
  const visibleUrl = localPreview ?? previewUrl;

  const validateAndUpload = async (file: File) => {
    setError(null);

    const ext = getExtension(file.name);
    if (!ALLOWED_MIME.includes(file.type) || !ALLOWED_EXT.includes(ext)) {
      setError("avatarErrorType");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setError("avatarErrorSize");
      return;
    }
    // Magic-byte check: a renamed .exe → .jpg has the wrong signature.
    try {
      const bytes = await readFirstBytes(file, 16);
      const detected = detectMagic(bytes);
      if (!detected || !ALLOWED_MAGIC.has(detected)) {
        setError("avatarErrorType");
        return;
      }
    } catch {
      setError("avatarErrorType");
      return;
    }

    // Instant local preview.
    const localUrl = URL.createObjectURL(file);
    setLocalPreview(localUrl);
    setUploading(true);

    const supabase = createSupabaseBrowserClient();
    const path = buildStoragePath(`${userId}/avatar`, file.name);
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      setError("avatarErrorUpload");
      setUploading(false);
      URL.revokeObjectURL(localUrl);
      setLocalPreview(null);
      return;
    }

    const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    setPreviewUrl(pub.publicUrl);
    setSubmittedUrl(pub.publicUrl);
    onChange(pub.publicUrl);
    setUploading(false);
  };

  const remove = () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    setPreviewUrl(null);
    setSubmittedUrl(null);
    setError(null);
    onChange(null);
  };

  return (
    <div className="flex items-start gap-5">
      <input type="hidden" name="avatar_url" value={submittedUrl ?? ""} />
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void validateAndUpload(f);
          e.target.value = "";
        }}
      />
      <div
        className={cn(
          "relative h-24 w-24 rounded-full overflow-hidden bg-gradient-to-br from-[var(--color-accent)] to-orange-500 flex items-center justify-center text-3xl font-semibold text-white shadow-[var(--shadow-glow)] ring-2 ring-white/10 shrink-0",
        )}
        aria-hidden
      >
        {visibleUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={visibleUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          initial
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="cursor-pointer inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[var(--radius)] border border-[var(--color-border-strong)] bg-transparent text-sm font-medium hover:bg-[var(--color-surface-elevated)] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            <Camera className="h-4 w-4" />
            {t("avatarChange")}
          </button>
          {visibleUrl && (
            <button
              type="button"
              onClick={remove}
              disabled={uploading}
              className="cursor-pointer inline-flex items-center gap-1.5 h-9 px-3 rounded-[var(--radius)] text-sm text-[var(--color-foreground-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]/40 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              {t("avatarRemove")}
            </button>
          )}
        </div>
        {uploading && (
          <p className="text-xs text-[var(--color-foreground-subtle)]">
            {t("avatarUploading")}
          </p>
        )}
        {error && (
          <p className="text-xs text-[var(--color-accent)]">{t(error)}</p>
        )}
      </div>
    </div>
  );
}
