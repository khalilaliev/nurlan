export const STORAGE_BUCKET = "story-media";

export const MAX_FILES_PER_STORY = 5;
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

export const ACCEPT_ATTR = [
  ...ACCEPTED_IMAGE_TYPES,
  ...ACCEPTED_VIDEO_TYPES,
].join(",");

export function isImageType(mime: string): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(mime);
}

export function isVideoType(mime: string): boolean {
  return ACCEPTED_VIDEO_TYPES.includes(mime);
}

export type MediaKind = "image" | "video";

export function kindForType(mime: string): MediaKind | null {
  if (isImageType(mime)) return "image";
  if (isVideoType(mime)) return "video";
  return null;
}

export type ValidationError =
  | "errorType"
  | "errorImageSize"
  | "errorVideoSize"
  | "errorMaxFiles";

export function validateFile(file: File): ValidationError | null {
  const kind = kindForType(file.type);
  if (!kind) return "errorType";
  if (kind === "image" && file.size > MAX_IMAGE_SIZE) return "errorImageSize";
  if (kind === "video" && file.size > MAX_VIDEO_SIZE) return "errorVideoSize";
  return null;
}

// Used to read kind from a stored URL (e.g. when restoring a draft from
// localStorage, the original File is gone).
export function kindForUrl(url: string): MediaKind {
  const m = url.toLowerCase().split("?")[0];
  if (
    m.endsWith(".mp4") ||
    m.endsWith(".webm") ||
    m.endsWith(".mov") ||
    m.endsWith(".m4v")
  ) {
    return "video";
  }
  return "image";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function buildStoragePath(userId: string, fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 10);
  return `${userId}/${stamp}-${rand}.${ext}`;
}
