// File-signature ("magic bytes") sniffing. Used as a third defence in depth
// on top of MIME type and extension checks, since both of those can be spoofed
// trivially (a renamed file or a forged MIME header).
//
// JPEG: FF D8 FF (any third-byte variant: E0, E1, etc.)
// MP4:  bytes 4..7 are ASCII "ftyp" (66 74 79 70)
// PNG:  89 50 4E 47 0D 0A 1A 0A
// WebP: bytes 0..3 = "RIFF", bytes 8..11 = "WEBP"

import type { MediaKind } from "./constants";

export type MagicKind = MediaKind | "png" | "webp";

export function detectMagic(bytes: Uint8Array): MagicKind | null {
  if (bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image";
  }

  // MP4: "ftyp" at offset 4..7
  if (
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    return "video";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }

  // WebP: "RIFF" + "WEBP"
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }

  return null;
}

export async function readFirstBytes(file: File, count = 16): Promise<Uint8Array> {
  const blob = file.slice(0, count);
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}

// Server-side: fetch only the first bytes via HTTP Range, cheap.
export async function fetchFirstBytes(url: string, count = 16): Promise<Uint8Array> {
  const res = await fetch(url, {
    headers: { Range: `bytes=0-${count - 1}` },
    cache: "no-store",
  });
  if (!res.ok && res.status !== 206) {
    throw new Error(`fetch ${url} failed: ${res.status}`);
  }
  const buffer = await res.arrayBuffer();
  return new Uint8Array(buffer);
}
