"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TwitchButton, OrSeparator } from "@/components/twitch-button";
import { signUp } from "@/app/actions/auth";

export function SignupForm() {
  const t = useTranslations("auth");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  if (status === "ok") {
    return (
      <p className="text-sm text-[var(--color-foreground-muted)] rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        {t("checkEmail")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <TwitchButton />
      <OrSeparator />
      <form
        action={async (fd) => {
          setSubmitting(true);
          const res = await signUp(fd);
          setSubmitting(false);
          if (res && "error" in res) setStatus("error");
          else setStatus("ok");
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
        {status === "error" && (
          <p className="text-sm text-[var(--color-accent)]">
            {t("errorGeneric")}
          </p>
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
        <p className="text-center text-xs text-[var(--color-foreground-muted)]">
          <Link href="/login" className="hover:text-[var(--color-foreground)]">
            {t("switchToLogin")}
          </Link>
        </p>
      </form>
    </div>
  );
}
