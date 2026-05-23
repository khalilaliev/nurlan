"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "@/app/actions/auth";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (sent) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-success)] leading-relaxed">
          {t("forgotSent")}
        </p>
        <Link
          href="/login"
          className="link-underline text-sm text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]"
        >
          ← {t("backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          const res = await requestPasswordReset(fd);
          if ("ok" in res) {
            setSent(true);
          } else {
            setError(t(res.error));
          }
        });
      }}
      className="space-y-4"
    >
      <Input
        name="email"
        type="email"
        placeholder={t("email")}
        required
        autoComplete="email"
        autoFocus
      />
      {error && <p className="text-sm text-[var(--color-accent)]">{error}</p>}
      <Button
        type="submit"
        variant="accent"
        size="lg"
        disabled={pending}
        className="w-full"
      >
        {pending ? t("forgotSending") : t("forgotSubmit")}
      </Button>
      <p className="text-center text-xs text-[var(--color-foreground-muted)] pt-2">
        <Link href="/login" className="hover:text-[var(--color-foreground)]">
          ← {t("backToLogin")}
        </Link>
      </p>
    </form>
  );
}
