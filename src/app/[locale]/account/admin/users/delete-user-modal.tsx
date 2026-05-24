"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminDeleteUser } from "@/app/actions/admin";
import type { AdminUserRowData } from "./admin-users-list";

// Type-the-username-to-confirm modal. Matches the pattern used in
// account self-deletion — irreversible action, so we force the admin
// to retype the target's username verbatim. The server re-validates
// the same constraint; the typing here is purely UX friction to
// prevent fat-finger deletions.
export function DeleteUserModal({
  user,
  onClose,
}: {
  user: AdminUserRowData;
  onClose: () => void;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Lock body scroll while open + Esc to close + autofocus the input.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    document.addEventListener("keydown", onKey);
    setTimeout(() => inputRef.current?.focus(), 80);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, pending]);

  const canSubmit =
    typed.trim().toLowerCase() === user.username.toLowerCase() && !pending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const res = await adminDeleteUser(user.id, typed);
      if (res && "error" in res) {
        // Map server error codes to localized messages. The `?? "db"`
        // defends against the action returning undefined in some Next
        // Server-Action return-type widening edge cases.
        const map: Record<string, string> = {
          selfDelete: "errorSelfDelete",
          usernameMismatch: "errorUsernameMismatch",
          notFound: "errorNotFound",
          forbidden: "errorForbidden",
          db: "errorDb",
        };
        const code = res.error ?? "db";
        setError(t(map[code] ?? "errorDb"));
        return;
      }
      // Success → refresh server data so the deleted row disappears.
      onClose();
      router.refresh();
    });
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        {/* Dim backdrop. Click to close (unless deletion in progress). */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => {
            if (!pending) onClose();
          }}
          aria-hidden
        />

        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-user-title"
          className="relative w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl p-6"
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Close X — hidden during deletion to prevent mid-delete clicks. */}
          {!pending && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="cursor-pointer absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center text-[var(--color-foreground-subtle)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-elevated)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-[var(--color-accent)]" />
            </div>
            <h2
              id="delete-user-title"
              className="text-base font-semibold tracking-tight"
            >
              {t("deleteUserTitle")}
            </h2>
          </div>

          <p className="text-sm text-[var(--color-foreground-muted)] leading-relaxed mb-4">
            {t("deleteUserBody")}
          </p>

          <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground-muted)] mb-1.5">
            {t("deleteUserConfirmLabel", { username: user.username })}
          </label>
          <Input
            ref={inputRef}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSubmit) handleSubmit();
            }}
            placeholder={t("deleteUserConfirmPlaceholder")}
            disabled={pending}
            autoComplete="off"
            spellCheck={false}
          />

          {error && (
            <p className="mt-3 text-sm text-[var(--color-accent)]">{error}</p>
          )}

          <div className="mt-5 flex items-center gap-3 justify-end">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClose}
              disabled={pending}
            >
              {t("deleteUserCancel")}
            </Button>
            <Button
              type="button"
              variant="accent"
              size="md"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {pending ? t("deleteUserDeleting") : t("deleteUserDelete")}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
}
