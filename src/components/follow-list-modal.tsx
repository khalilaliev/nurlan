"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import gsap from "gsap";
import { Link } from "@/i18n/navigation";
import {
  listFollowers,
  listFollowing,
  type ProfileRowLite,
} from "@/app/actions/follows";

type Mode = "followers" | "following";

export function FollowListTrigger({
  userId,
  mode,
  count,
  label,
  emptyLabel,
}: {
  userId: string;
  mode: Mode;
  count: number;
  label: string;
  emptyLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ProfileRowLite[] | null>(null);
  const [pending, startTransition] = useTransition();

  const handleOpen = () => {
    setOpen(true);
    if (items === null) {
      startTransition(async () => {
        const data =
          mode === "followers"
            ? await listFollowers(userId)
            : await listFollowing(userId);
        setItems(data);
      });
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="cursor-pointer text-sm hover:text-[var(--color-foreground)] transition-colors group"
      >
        <span className="font-semibold tabular-nums text-[var(--color-foreground)]">
          {count.toLocaleString()}
        </span>{" "}
        <span className="text-[var(--color-foreground-muted)] group-hover:text-[var(--color-foreground)] transition-colors">
          {label}
        </span>
      </button>
      {open && (
        <FollowListModal
          label={label}
          emptyLabel={emptyLabel}
          items={items}
          pending={pending}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function FollowListModal({
  label,
  emptyLabel,
  items,
  pending,
  onClose,
}: {
  label: string;
  emptyLabel: string;
  items: ProfileRowLite[] | null;
  pending: boolean;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!overlayRef.current || !panelRef.current) return;
    gsap.fromTo(
      overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.18, ease: "power3.out" },
    );
    gsap.fromTo(
      panelRef.current,
      { opacity: 0, y: 12, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: "power3.out" },
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

  if (!mounted) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={panelRef}
        className="w-full max-w-md max-h-[80vh] flex flex-col rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-[var(--color-foreground)]">
            {label}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-elevated)] transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {pending && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--color-foreground-muted)]" />
            </div>
          )}
          {!pending && items && items.length === 0 && (
            <p className="text-sm text-[var(--color-foreground-subtle)] text-center py-12">
              {emptyLabel}
            </p>
          )}
          {!pending && items && items.length > 0 && (
            <ul className="space-y-0.5">
              {items.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/user/${p.username}`}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] hover:bg-[var(--color-surface-elevated)] transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-[var(--color-accent)] to-orange-500 flex items-center justify-center text-white font-semibold shrink-0 ring-1 ring-white/10">
                      {p.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        p.username.slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {p.display_name || p.username}
                      </div>
                      <div className="text-xs text-[var(--color-foreground-subtle)] truncate">
                        @{p.username}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
