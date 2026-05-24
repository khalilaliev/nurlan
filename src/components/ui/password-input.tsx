"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

// Drop-in replacement for <Input type="password" />. Same outer
// dimensions as the regular Input (h-11), same focus ring, same colour
// tokens — only addition is a 36×36 toggle button on the right that
// flips the input between `password` and `text`.
//
// Animation: Eye and EyeOff are separate Lucide SVGs, so we crossfade
// + rotate them with framer-motion's AnimatePresence. The rotate gives
// a "blink" feel without needing to morph the SVG path itself, which
// would require a custom icon. Spring `stiffness: 320, damping: 22` is
// the same curve used elsewhere in the app's hover/menu animations, so
// the motion language is consistent.
//
// Accessibility:
//   - The button has aria-label that updates ("Show password" /
//     "Hide password") so screen readers announce the action.
//   - aria-pressed mirrors the visible state for AT users.
//   - tabIndex=-1 means Tab from the input jumps PAST the eye to the
//     next field (typical pattern — eye is mouse/touch only).
//   - When the input is disabled, the button is also disabled.

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">
>(({ className, disabled, ...props }, ref) => {
  const t = useTranslations("auth");
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative w-full">
      <input
        ref={ref}
        type={visible ? "text" : "password"}
        disabled={disabled}
        className={cn(
          // Match Input's base styles, plus right-padding for the eye.
          "flex h-11 w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-4 pr-12 text-base sm:text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-subtle)] focus-visible:outline-none focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent-soft)] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />

      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label={visible ? t("hidePassword") : t("showPassword")}
        className={cn(
          "absolute right-1 top-1/2 -translate-y-1/2",
          "h-9 w-9 rounded-[8px] flex items-center justify-center",
          "text-[var(--color-foreground-subtle)] hover:text-[var(--color-foreground)]",
          "hover:bg-[var(--color-surface-elevated)]",
          "active:scale-90",
          "transition-[color,background-color,transform] duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-soft)]",
          "disabled:pointer-events-none disabled:opacity-40",
        )}
      >
        {/* Crossfade + rotate between Eye and EyeOff. The keys on each
            <motion.span> tell AnimatePresence to treat them as
            distinct elements so enter/exit animations actually fire. */}
        <AnimatePresence mode="wait" initial={false}>
          {visible ? (
            <motion.span
              key="eye-off"
              initial={{ opacity: 0, rotate: -20, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 20, scale: 0.6 }}
              transition={{
                type: "spring",
                stiffness: 320,
                damping: 22,
              }}
              className="inline-flex"
            >
              <EyeOff className="h-4 w-4" />
            </motion.span>
          ) : (
            <motion.span
              key="eye"
              initial={{ opacity: 0, rotate: 20, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -20, scale: 0.6 }}
              transition={{
                type: "spring",
                stiffness: 320,
                damping: 22,
              }}
              className="inline-flex"
            >
              <Eye className="h-4 w-4" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";
