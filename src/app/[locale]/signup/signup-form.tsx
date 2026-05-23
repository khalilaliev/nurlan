"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  TwitchButton,
  GoogleButton,
  OrSeparator,
} from "@/components/oauth-buttons";
import { signUp } from "@/app/actions/auth";

export function SignupForm() {
  const t = useTranslations("auth");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok">("idle");
  // Hold the discriminated error code from the server so we render the
  // matching message (rate-limited / weak-password / generic) instead
  // of a hardcoded "something went wrong".
  const [errorKey, setErrorKey] = useState<string | null>(null);

  if (status === "ok") {
    return (
      <p className="text-sm text-[var(--color-foreground-muted)] rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        {t("checkEmail")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <form
        action={async (fd) => {
          setSubmitting(true);
          setErrorKey(null);
          const res = await signUp(fd);
          setSubmitting(false);
          if (res && "error" in res) {
            // Server Actions widen the return to include undefined in
            // some Next config combos; coalesce defensively.
            setErrorKey(res.error ?? "errorGeneric");
          } else {
            setStatus("ok");
          }
        }}
        className="space-y-4"
      >
        <Input
          name="email"
          type="email"
          placeholder={t("email")}
          required
          autoComplete="email"
        />
        <Input
          name="password"
          type="password"
          placeholder={t("password")}
          required
          autoComplete="new-password"
          minLength={6}
        />
        {errorKey && (
          <p className="text-sm text-[var(--color-accent)]">{t(errorKey)}</p>
        )}
        <Button
          type="submit"
          variant="accent"
          size="lg"
          disabled={submitting}
          className="w-full"
        >
          {t("submitSignup")}
        </Button>
      </form>

      <OrSeparator />

      <div className="space-y-3">
        <TwitchButton />
        <GoogleButton />
      </div>

      <p className="text-center text-xs text-[var(--color-foreground-muted)] pt-2">
        <Link href="/login" className="hover:text-[var(--color-foreground)]">
          {t("switchToLogin")}
        </Link>
      </p>
    </div>
  );
}
