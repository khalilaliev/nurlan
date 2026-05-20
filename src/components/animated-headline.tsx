"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

// Letter-by-letter entrance animation with a single continuous gradient
// flowing across the whole headline.
//
// Implementation notes:
//
// 1. `background-clip: text` on a PARENT element ignores child opacity —
//    so per-character opacity can't hide chars when the parent owns the
//    gradient. The fix is to put `gradient-text` on each character span.
//
// 2. But that gives every char its own gradient cycle (visible stripes).
//    The fix is to size each char's gradient to the headline's full box
//    and shift its background-position so it shows only the slice that
//    corresponds to that char's location. Result: visually one continuous
//    gradient, technically N independent backgrounds with opacity that
//    actually works.
//
// 3. Descenders ("р", "у", "у") extend BELOW the headline's line-box
//    when line-height is tight. If the gradient height equals the box
//    height, descender pixels fall outside the gradient and render as
//    transparent. We add a buffer proportional to the computed font-size
//    so descenders always get a gradient color.
//
// 4. Inter-word separator uses U+00A0 (non-breaking space) because a
//    plain " " inside an inline-block gets whitespace-collapsed when it
//    is the element's only content — that's why earlier builds rendered
//    words butted together.

const NBSP = " ";

export function AnimatedHeadline({
  text,
  className,
  gradientClassName = "gradient-text",
  stagger = 0.010,
  duration = 1,
  delay = 0.06,
  as: Tag = "h1",
}: {
  text: string;
  className?: string;
  /**
   * Class applied to every character span. Defaults to `gradient-text`.
   * Pass an empty string for a plain-color headline.
   */
  gradientClassName?: string;
  stagger?: number;
  duration?: number;
  delay?: number;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const ref = useRef<HTMLElement>(null);
  const usesGradient = gradientClassName.includes("gradient-text");

  useEffect(() => {
    if (!ref.current) return;
    const root = ref.current;
    const chars = root.querySelectorAll<HTMLElement>("[data-char]");
    if (chars.length === 0) return;

    const positionGradients = () => {
      if (!usesGradient) return;
      const rootRect = root.getBoundingClientRect();
      const w = rootRect.width;
      const h = rootRect.height;
      if (w === 0 || h === 0) return;

      // Account for descenders that extend beyond the tight line-box.
      // ~35% of font-size is a safe buffer for most fonts; Montserrat's
      // descender is ~22% of em.
      const fontSize = parseFloat(window.getComputedStyle(root).fontSize);
      const buffer = isFinite(fontSize) ? fontSize * 0.35 : 16;
      const gradientW = w;
      const gradientH = h + buffer;

      chars.forEach((char) => {
        const r = char.getBoundingClientRect();
        const ox = r.left - rootRect.left;
        const oy = r.top - rootRect.top;
        char.style.backgroundSize = `${gradientW}px ${gradientH}px`;
        char.style.backgroundPosition = `${-ox}px ${-oy}px`;
        char.style.backgroundRepeat = "no-repeat";
      });
    };

    positionGradients();

    const ro = new ResizeObserver(positionGradients);
    ro.observe(root);

    // Webfonts that load after first paint shift glyph positions; re-run.
    const fontReady =
      typeof document !== "undefined" && "fonts" in document
        ? (document as Document & { fonts: { ready: Promise<unknown> } }).fonts
          .ready
        : null;
    fontReady?.then(positionGradients);

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      gsap.set(chars, { opacity: 1, y: 0, filter: "blur(0px)" });
      return () => ro.disconnect();
    }

    // The animation: opacity + small lift + light blur clearing.
    // `expo.out` gives a smooth "swooping in" deceleration — feels
    // cinematic without being theatrical.
    const ctx = gsap.context(() => {
      gsap.fromTo(
        chars,
        {
          opacity: 0,
          y: 16,
          filter: "blur(6px)",
        },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration,
          ease: "expo.out",
          stagger,
          delay,
        },
      );
    }, root);

    return () => {
      ro.disconnect();
      ctx.revert();
    };
  }, [text, stagger, duration, delay, usesGradient]);

  const words = text.split(" ");
  const Component = Tag as unknown as React.ComponentType<{
    ref: React.Ref<HTMLElement>;
    className?: string;
    "aria-label"?: string;
    children?: React.ReactNode;
  }>;

  return (
    <Component ref={ref} className={className} aria-label={text}>
      {words.map((word, wi) => (
        <span
          key={`w-${wi}`}
          className="inline-block whitespace-nowrap"
          aria-hidden="true"
        >
          {Array.from(word).map((ch, ci) => (
            <span
              key={`c-${wi}-${ci}`}
              data-char
              className={cn(
                "inline-block will-change-[transform,opacity,filter]",
                gradientClassName,
              )}
            >
              {ch}
            </span>
          ))}
          {wi < words.length - 1 && (
            <span
              data-char
              className={cn("inline-block", gradientClassName)}
            >
              {NBSP}
            </span>
          )}
        </span>
      ))}
    </Component>
  );
}
