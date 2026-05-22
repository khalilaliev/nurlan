"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { sendContactMessage } from "@/app/actions/inbox";

export function ContactForm({
  defaultName = "",
  defaultEmail = "",
}: {
  defaultName?: string;
  defaultEmail?: string;
}) {
  const t = useTranslations("contact");
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 p-6 text-center">
        <p className="text-base font-semibold text-[var(--color-foreground)] mb-1">
          {t("thanks")}
        </p>
        <p className="text-sm text-[var(--color-foreground-muted)]">
          {t("thanksBody")}
        </p>
      </div>
    );
  }

  return (
    <form
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          const res = await sendContactMessage(fd);
          if ("ok" in res) {
            setDone(true);
          } else {
            setError(
              res.error === "invalid" ? t("errorInvalid") : t("errorGeneric"),
            );
          }
        });
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t("name")}>
          <Input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
            required
            maxLength={120}
            disabled={pending}
          />
        </Field>
        <Field label={t("email")}>
          <Input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            required
            maxLength={320}
            disabled={pending}
          />
        </Field>
      </div>

      <Field label={t("subject")}>
        <Input
          name="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={t("subjectPlaceholder")}
          maxLength={200}
          disabled={pending}
        />
      </Field>

      <Field label={t("body")}>
        <Textarea
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("bodyPlaceholder")}
          required
          minLength={10}
          maxLength={5000}
          rows={8}
          disabled={pending}
          className="min-h-40 leading-relaxed"
        />
      </Field>

      {error && <p className="text-sm text-[var(--color-accent)]">{error}</p>}

      <Button
        type="submit"
        variant="accent"
        size="lg"
        disabled={pending}
        className="w-full"
      >
        {pending ? t("sending") : t("submit")}
      </Button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[var(--color-foreground-muted)] uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}
