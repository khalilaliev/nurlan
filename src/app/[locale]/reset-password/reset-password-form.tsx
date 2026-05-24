"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { updatePassword } from "@/app/actions/auth";

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => {
        setError(null);
        if (password !== confirm) {
          setError(t("errorPasswordMismatch"));
          return;
        }
        startTransition(async () => {
          const res = await updatePassword(fd);
          if ("ok" in res) {
            // Recovery session is now a regular session — go home.
            router.replace("/");
          } else {
            setError(t(res.error));
          }
        });
      }}
      className="space-y-4"
    >
      <PasswordInput
        name="password"
        placeholder={t("newPassword")}
        required
        autoComplete="new-password"
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
      />
      <PasswordInput
        placeholder={t("confirmPassword")}
        required
        autoComplete="new-password"
        minLength={6}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      {error && <p className="text-sm text-[var(--color-accent)]">{error}</p>}
      <Button
        type="submit"
        variant="accent"
        size="lg"
        disabled={pending}
        className="w-full"
      >
        {pending ? t("resetSaving") : t("resetSubmit")}
      </Button>
    </form>
  );
}
