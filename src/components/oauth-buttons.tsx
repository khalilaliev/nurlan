"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Provider } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function useOAuth(provider: Provider, next: string) {
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
      provider,
      options: {
        redirectTo: `${origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (oauthError) {
      setError(t("errorGeneric"));
      setSubmitting(false);
    }
  };

  return { handle, submitting, error };
}

export function TwitchButton({ next = "/" }: { next?: string }) {
  const t = useTranslations("auth");
  const { handle, submitting, error } = useOAuth("twitch", next);

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

export function GoogleButton({ next = "/" }: { next?: string }) {
  const t = useTranslations("auth");
  const { handle, submitting, error } = useOAuth("google", next);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={handle}
        disabled={submitting}
        className="w-full bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-900 gap-2"
      >
        <GoogleIcon className="h-4 w-4" />
        {t("google")}
      </Button>
      {error && (
        <p className="text-xs text-[var(--color-accent)] text-center">{error}</p>
      )}
    </div>
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

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        fill="#EA4335"
        d="M12 11v3.6h5.05c-.22 1.18-1.43 3.47-5.05 3.47-3.04 0-5.52-2.52-5.52-5.62s2.48-5.62 5.52-5.62c1.73 0 2.89.74 3.55 1.37l2.42-2.33C16.46 4.66 14.43 3.7 12 3.7c-4.65 0-8.4 3.76-8.4 8.4s3.75 8.4 8.4 8.4c4.85 0 8.06-3.41 8.06-8.21 0-.55-.06-.98-.13-1.39H12z"
      />
      <path
        fill="#4285F4"
        d="M20.06 12.29c0-.55-.06-.98-.13-1.39H12V14.5h4.58c-.18.99-.74 1.83-1.57 2.39l2.55 1.98c1.49-1.38 2.5-3.4 2.5-6.58z"
      />
      <path
        fill="#FBBC05"
        d="M6.48 14.16c-.18-.54-.28-1.11-.28-1.71s.1-1.17.28-1.71L3.92 8.76C3.34 9.91 3 11.18 3 12.45s.34 2.54.92 3.69l2.56-1.98z"
      />
      <path
        fill="#34A853"
        d="M12 21.15c2.43 0 4.46-.8 5.95-2.18l-2.55-1.98c-.78.52-1.83.89-3.4.89-2.61 0-4.83-1.76-5.62-4.14L3.81 15.7C5.31 18.93 8.4 21.15 12 21.15z"
      />
    </svg>
  );
}
