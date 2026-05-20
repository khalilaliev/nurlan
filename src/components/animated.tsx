"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

type Direction = "up" | "down" | "left" | "right" | "none";

export function FadeIn({
  children,
  delay = 0,
  duration = 0.6,
  y = 12,
  x = 0,
  direction = "up",
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  x?: number;
  direction?: Direction;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const offsetY =
      direction === "up" ? y : direction === "down" ? -y : 0;
    const offsetX =
      direction === "left" ? x : direction === "right" ? -x : 0;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: offsetY, x: offsetX },
        {
          opacity: 1,
          y: 0,
          x: 0,
          duration,
          delay,
          ease: "power3.out",
        },
      );
    });
    return () => ctx.revert();
  }, [delay, duration, y, x, direction]);

  const Component = Tag as unknown as React.ComponentType<{
    ref: React.Ref<HTMLElement>;
    className?: string;
    children?: React.ReactNode;
  }>;

  return (
    <Component ref={ref} className={className}>
      {children}
    </Component>
  );
}

export function Stagger({
  children,
  delay = 0,
  stagger = 0.06,
  y = 12,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  stagger?: number;
  y?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      const items = ref.current?.children;
      if (!items || items.length === 0) return;
      gsap.fromTo(
        items,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          delay,
          stagger,
          ease: "power3.out",
        },
      );
    }, ref);
    return () => ctx.revert();
  }, [delay, stagger, y]);

  const Component = Tag as unknown as React.ComponentType<{
    ref: React.Ref<HTMLElement>;
    className?: string;
    children?: React.ReactNode;
  }>;

  return (
    <Component ref={ref} className={className}>
      {children}
    </Component>
  );
}

export function CountUp({
  to,
  duration = 2,
  delay = 0,
  className,
  format,
  locale,
}: {
  to: number;
  duration?: number;
  delay?: number;
  className?: string;
  format?: (n: number) => string;
  locale?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // If IntersectionObserver isn't available, fall back to running immediately.
    if (typeof IntersectionObserver === "undefined") {
      runAnimation();
      return;
    }

    let played = false;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !played) {
            played = true;
            runAnimation();
            observer.disconnect();
          }
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(node);

    function runAnimation() {
      if (!node) return;
      // Seed with the formatted zero immediately so we never flash 0 in
      // the wrong locale format.
      node.textContent = format ? format(0) : (0).toLocaleString(locale);
      const obj = { val: 0 };
      gsap.to(obj, {
        val: to,
        duration,
        delay,
        ease: "power2.out",
        onUpdate: () => {
          const n = Math.round(obj.val);
          node.textContent = format ? format(n) : n.toLocaleString(locale);
        },
      });
    }

    return () => observer.disconnect();
  }, [to, duration, delay, format, locale]);

  return (
    <span ref={ref} className={className}>
      {format ? format(0) : "0"}
    </span>
  );
}
