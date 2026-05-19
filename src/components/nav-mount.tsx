"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function NavMount({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

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

  return <div ref={ref}>{children}</div>;
}
