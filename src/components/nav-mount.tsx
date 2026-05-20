"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

export function NavMount({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Initial entrance animation.
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: -12 },
        { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" },
      );
    });
    return () => ctx.revert();
  }, []);

  // Toggle frosted state once the user scrolls past the threshold. rAF
  // throttling keeps this cheap; the handler itself is one read + one
  // compare. State only updates when the boolean flips, so React re-renders
  // are minimal.
  useEffect(() => {
    let ticking = false;
    let lastScrolled = scrolled;

    const compute = () => {
      const isScrolled = window.scrollY > 24;
      if (isScrolled !== lastScrolled) {
        lastScrolled = isScrolled;
        setScrolled(isScrolled);
      }
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(compute);
    };

    // Set initial value (e.g. after navigation when scroll position is
    // restored).
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
    // We intentionally don't depend on `scrolled` here — the closure-local
    // `lastScrolled` mirrors it, and depending on state would re-attach the
    // listener on every flip.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      data-scrolled={scrolled || undefined}
      className={cn("sticky top-0 z-40 site-header", scrolled && "is-scrolled")}
    >
      {children}
    </div>
  );
}
