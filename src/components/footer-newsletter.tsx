"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function FooterNewsletter() {
  const t = useTranslations("footer");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className="text-xs text-[var(--color-success)]">
        {t("newsletterThanks")}
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!email.includes("@")) return;
        // No backend yet — this is a UI placeholder per spec. When a real
        // mailing-list service is wired up, swap this for a server action.
        setDone(true);
      }}
      className="flex flex-col sm:flex-row gap-2"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("newsletterPlaceholder")}
        aria-label={t("newsletterTitle")}
        className="h-10 flex-1 min-w-0 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-subtle)] focus-visible:outline-none focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent-soft)] transition-colors"
      />
      <button
        type="submit"
        className="cursor-pointer h-10 px-4 rounded-[var(--radius)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)] text-sm font-medium hover:brightness-110 active:scale-[0.98] shadow-[var(--shadow-glow)] transition-all"
      >
        {t("newsletterSubmit")}
      </button>
    </form>
  );
}
