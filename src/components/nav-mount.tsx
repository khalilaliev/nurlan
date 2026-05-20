"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

export function NavMount({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Entrance animation. CRITICAL: we clear the inline `transform` on
  // complete. A non-`none` transform on this wrapper creates a "backdrop
  // root" (per filter-effects-2 spec), which traps the inner header's
  // `backdrop-filter` so it can't blur the actual page content behind it
  // — only what's inside the wrapper (which is empty). Clearing the
  // transform once the animation lands restores normal backdrop-filter
  // behaviour. Opacity persists at 1, which is fine because opacity:1 is
  // the default value and doesn't create a backdrop root.
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: -12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: "power3.out",
          onComplete: () => {
            if (ref.current) {
              gsap.set(ref.current, { clearProps: "transform,willChange" });
            }
          },
        },
      );
    });
    return () => ctx.revert();
  }, []);

  // rAF-throttled scroll watcher. Only flips state on the boundary so React
  // re-renders are minimal.
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

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
