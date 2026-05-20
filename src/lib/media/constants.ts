export const STORAGE_BUCKET = "story-media";

export const MAX_FILES_PER_STORY = 5;
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB

// Locked-down allow-lists. To support more types later, add MIME + ext entries
// here and the validateFile / kindForUrl helpers automatically follow.
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg"];
export const ACCEPTED_VIDEO_TYPES = ["video/mp4"];

export const ACCEPTED_IMAGE_EXTENSIONS = ["jpg", "jpeg"];
export const ACCEPTED_VIDEO_EXTENSIONS = ["mp4"];

// `accept` attribute string for the OS file picker.
export const ACCEPT_ATTR = "image/jpeg,.jpg,.jpeg,video/mp4,.mp4";

export type MediaKind = "image" | "video";

function getExtension(name: string): string {
  const lower = name.toLowerCase().trim();
  const idx = lower.lastIndexOf(".");
  if (idx < 0 || idx === lower.length - 1) return "";
  return lower.slice(idx + 1);
}

function isAllowedImageExt(ext: string): boolean {
  return ACCEPTED_IMAGE_EXTENSIONS.includes(ext);
}

function isAllowedVideoExt(ext: string): boolean {
  return ACCEPTED_VIDEO_EXTENSIONS.includes(ext);
}

export function classifyFile(file: File): MediaKind | null {
  const ext = getExtension(file.name);
  const mime = file.type;

  // Both signals must agree on the same kind. This blocks weird OS files
  // (.lnk / .url / .webloc) that report empty/wrong MIME, AND blocks renamed
  // executables that have an allowed extension but a non-media MIME.
  if (mime === "image/jpeg" && isAllowedImageExt(ext)) return "image";
  if (mime === "video/mp4" && isAllowedVideoExt(ext)) return "video";

  // Some browsers report empty MIME for valid drag-drop files. Allow extension
  // to vouch ONLY when MIME is missing — never when MIME is something else.
  if (mime === "" && isAllowedImageExt(ext)) return "image";
  if (mime === "" && isAllowedVideoExt(ext)) return "video";

  return null;
}

export type ValidationError =
  | "errorType"
  | "errorImageSize"
  | "errorVideoSize"
  | "errorMaxFiles"
  | "errorBadSignature";

export type ValidatedFile =
  | { ok: true; kind: MediaKind }
  | { ok: false; kind: MediaKind | null; error: ValidationError };

export function validateFile(file: File): ValidatedFile {
  const kind = classifyFile(file);
  if (!kind) return { ok: false, kind: null, error: "errorType" };
  if (kind === "image" && file.size > MAX_IMAGE_SIZE) {
    return { ok: false, kind, error: "errorImageSize" };
  }
  if (kind === "video" && file.size > MAX_VIDEO_SIZE) {
    return { ok: false, kind, error: "errorVideoSize" };
  }
  return { ok: true, kind };
}

export function kindForUrl(url: string): MediaKind {
  const m = url.toLowerCase().split("?")[0];
  if (m.endsWith(".mp4")) return "video";
  return "image";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function buildStoragePath(userId: string, fileName: string): string {
  const ext = getExtension(fileName).replace(/[^a-z0-9]/g, "") || "bin";
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 10);
  return `${userId}/${stamp}-${rand}.${ext}`;
}
