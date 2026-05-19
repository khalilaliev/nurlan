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
import { signIn } from "@/app/actions/auth";

export function LoginForm() {
  const t = useTranslations("auth");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <form
        action={async (fd) => {
          setSubmitting(true);
          setError(null);
          const res = await signIn(fd);
          setSubmitting(false);
          if (res && "error" in res) setError(t(res.error));
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
          autoComplete="current-password"
          minLength={6}
        />
        {error && <p className="text-sm text-[var(--color-accent)]">{error}</p>}
        <Button
          type="submit"
          variant="accent"
          size="lg"
          disabled={submitting}
          className="w-full"
        >
          {t("submitLogin")}
        </Button>
      </form>

      <OrSeparator />

      <div className="space-y-3">
        <TwitchButton />
        <GoogleButton />
      </div>

      <p className="text-center text-xs text-[var(--color-foreground-muted)] pt-2">
        <Link href="/signup" className="hover:text-[var(--color-foreground)]">
          {t("switchToSignup")}
        </Link>
      </p>
    </div>
  );
}
