"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ShieldAlert, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptRules } from "@/app/actions/account";

export function RulesModal({
  open,
  onAccepted,
  onCancel,
}: {
  open: boolean;
  onAccepted: () => void;
  onCancel?: () => void;
}) {
  const t = useTranslations("rules");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const rules = [
    t("rule1"),
    t("rule2"),
    t("rule3"),
    t("rule4"),
    t("rule5"),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden
      />
      <div className="relative w-full max-w-lg rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div
          className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full bg-[var(--color-accent-soft)] blur-3xl"
          aria-hidden
        />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-[var(--color-accent)]" />
            </div>
            <h2
              id="rules-title"
              className="text-xl font-semibold tracking-tight"
            >
              {t("title")}
            </h2>
          </div>
          <p className="text-sm text-[var(--color-foreground-muted)] mb-5">
            {t("subtitle")}
          </p>

          <ul className="space-y-2.5 mb-5">
            {rules.map((rule, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-[var(--color-foreground)] leading-relaxed"
              >
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] text-xs font-semibold">
                  {i + 1}
                </span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-[var(--color-foreground-subtle)] leading-relaxed mb-5 border-l-2 border-[var(--color-accent)]/40 pl-3">
            {t("footer")}
          </p>

          <label className="flex items-center gap-2.5 mb-5 cursor-pointer select-none group">
            <span
              className={
                agreed
                  ? "h-5 w-5 rounded border-2 border-[var(--color-accent)] bg-[var(--color-accent)] flex items-center justify-center transition-all"
                  : "h-5 w-5 rounded border-2 border-[var(--color-border-strong)] group-hover:border-[var(--color-foreground-muted)] transition-all"
              }
            >
              {agreed && (
                <Check
                  className="h-3.5 w-3.5 text-[var(--color-accent-foreground)]"
                  strokeWidth={3}
                />
              )}
            </span>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="sr-only"
            />
            <span className="text-sm">{t("agreeLabel")}</span>
          </label>

          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={submitting}
              >
                {t("cancel")}
              </Button>
            )}
            <Button
              type="button"
              variant="accent"
              disabled={!agreed || submitting}
              onClick={async () => {
                setSubmitting(true);
                const res = await acceptRules();
                setSubmitting(false);
                if (res && "ok" in res) onAccepted();
              }}
            >
              {t("agreeButton")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
