"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { subscribeNewsletter } from "@/app/actions/inbox";

export function FooterNewsletter() {
  const t = useTranslations("footer");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <p className="text-xs text-[var(--color-success)]">
        {t("newsletterThanks")}
      </p>
    );
  }

  return (
    <form
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          const res = await subscribeNewsletter(fd);
          if ("ok" in res) {
            setDone(true);
            setEmail("");
          } else {
            setError(t("newsletterError"));
          }
        });
      }}
    >
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("newsletterPlaceholder")}
          aria-label={t("newsletterTitle")}
          disabled={pending}
          className="h-10 py-3 flex-1 min-w-0 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-base sm:text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-subtle)] focus-visible:outline-none focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent-soft)] transition-colors disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer h-10 px-4 rounded-[var(--radius)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)] text-sm font-medium hover:brightness-110 active:scale-[0.98] shadow-[var(--shadow-glow)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? t("newsletterSending") : t("newsletterSubmit")}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs text-[var(--color-accent)]">{error}</p>
      )}
    </form>
  );
}
