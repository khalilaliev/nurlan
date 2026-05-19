import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-foreground-muted)]",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
