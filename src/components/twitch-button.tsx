"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function TwitchButton({ next = "/" }: { next?: string }) {
  const t = useTranslations("auth");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = async () => {
    setSubmitting(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "twitch",
      options: {
        redirectTo: `${origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (oauthError) {
      setError(t("errorGeneric"));
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={handle}
        disabled={submitting}
        className="w-full bg-[#9146FF] hover:bg-[#7B2FFF] border-[#9146FF] text-white gap-2"
      >
        <TwitchIcon className="h-4 w-4" />
        {t("twitch")}
      </Button>
      {error && (
        <p className="text-xs text-[var(--color-accent)] text-center">{error}</p>
      )}
    </div>
  );
}

function TwitchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M2.149 0L.537 4.119v17.81h6.131V24h3.224l2.687-2.071h4.836L24 14.756V0H2.149zm2.687 1.612h17.025v12.337l-3.762 3.762h-5.91l-2.687 2.071v-2.071H4.836V1.612zM9.673 12.881h2.151V6.749H9.673v6.132zm5.91 0h2.151V6.749h-2.151v6.132z" />
    </svg>
  );
}

export function OrSeparator() {
  const t = useTranslations("auth");
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 border-t border-[var(--color-border)]" />
      <span className="text-xs uppercase tracking-wider text-[var(--color-foreground-subtle)]">
        {t("or")}
      </span>
      <div className="flex-1 border-t border-[var(--color-border)]" />
    </div>
  );
}
