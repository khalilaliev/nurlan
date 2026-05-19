"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Play, X } from "lucide-react";
import { kindForUrl } from "@/lib/media/constants";
import { cn } from "@/lib/utils";

export function MediaGallery({ urls }: { urls: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      const items = containerRef.current?.querySelectorAll("[data-tile]");
      if (!items || items.length === 0) return;
      gsap.fromTo(
        items,
        { opacity: 0, y: 12, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.06,
          ease: "power3.out",
        },
      );
    }, containerRef);
    return () => ctx.revert();
  }, [urls]);

  if (urls.length === 0) return null;

  const layoutClass = (() => {
    if (urls.length === 1) return "grid-cols-1";
    if (urls.length === 2) return "grid-cols-2";
    if (urls.length === 3) return "grid-cols-2";
    return "grid-cols-2 sm:grid-cols-3";
  })();

  return (
    <>
      <div
        ref={containerRef}
        className={cn(
          "grid gap-2 sm:gap-2.5 rounded-[var(--radius-lg)]",
          layoutClass,
        )}
      >
        {urls.map((url, i) => {
          const kind = kindForUrl(url);
          // For 3 items: first spans 2 rows on the left.
          const spanClass =
            urls.length === 3 && i === 0
              ? "row-span-2"
              : "";
          const aspect =
            urls.length === 1
              ? "aspect-video"
              : urls.length === 3 && i === 0
                ? ""
                : "aspect-square";
          return (
            <Tile
              key={`${url}-${i}`}
              url={url}
              kind={kind}
              spanClass={spanClass}
              aspectClass={aspect}
              onOpen={() => setLightbox(i)}
            />
          );
        })}
      </div>

      {lightbox !== null && (
        <Lightbox
          url={urls[lightbox]}
          kind={kindForUrl(urls[lightbox])}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}

function Tile({
  url,
  kind,
  spanClass,
  aspectClass,
  onOpen,
}: {
  url: string;
  kind: "image" | "video";
  spanClass: string;
  aspectClass: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      data-tile
      onClick={onOpen}
      className={cn(
        "group relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-strong)] transition-all",
        spanClass,
        aspectClass,
      )}
    >
      {kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <>
          <video
            src={url}
            className="h-full w-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/10">
            <div className="h-12 w-12 rounded-full bg-black/60 backdrop-blur flex items-center justify-center transition-transform group-hover:scale-110">
              <Play className="h-5 w-5 text-white fill-white ml-0.5" />
            </div>
          </div>
        </>
      )}
    </button>
  );
}

function Lightbox({
  url,
  kind,
  onClose,
}: {
  url: string;
  kind: "image" | "video";
  onClose: () => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!boxRef.current) return;
    gsap.fromTo(
      boxRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.2, ease: "power3.out" },
    );
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      ref={boxRef}
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 backdrop-blur text-white flex items-center justify-center hover:bg-white/20 transition-colors"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
      <div
        className="relative max-h-full max-w-6xl flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className="max-h-[90vh] max-w-full object-contain rounded-[var(--radius-lg)]"
          />
        ) : (
          <video
            src={url}
            controls
            autoPlay
            playsInline
            className="max-h-[90vh] max-w-full rounded-[var(--radius-lg)]"
          />
        )}
      </div>
    </div>
  );
}
