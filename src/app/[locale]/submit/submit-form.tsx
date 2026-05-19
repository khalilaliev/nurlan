"use client";

import { useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RulesModal } from "@/components/rules-modal";
import { createStory } from "@/app/actions/stories";

export function SubmitForm({
  categories,
  rulesAccepted,
}: {
  categories: { slug: string; name: string; emoji: string }[];
  rulesAccepted: boolean;
}) {
  const t = useTranslations("submit");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(rulesAccepted);
  const [showRules, setShowRules] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const submit = async (fd: FormData) => {
    setSubmitting(true);
    setError(null);
    const res = await createStory(fd);
    setSubmitting(false);
    if (res && "error" in res && res.error) {
      const key = res.error as "errorAuth" | "errorGeneric";
      setError(t(key));
      return;
    }
    if (res && "id" in res && typeof res.id === "string") {
      router.push(`/story/${res.id}`);
    }
  };

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        if (!accepted) {
          setShowRules(true);
          return;
        }
        await submit(fd);
      }}
      className="space-y-5"
    >
      <RulesModal
        open={showRules}
        onCancel={() => setShowRules(false)}
        onAccepted={() => {
          setAccepted(true);
          setShowRules(false);
          if (formRef.current) {
            const fd = new FormData(formRef.current);
            void submit(fd);
          }
        }}
      />
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--color-foreground-muted)] uppercase tracking-wider">
          {t("fieldTitle")}
        </label>
        <Input
          name="title"
          required
          minLength={3}
          maxLength={200}
          placeholder={t("fieldTitlePlaceholder")}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--color-foreground-muted)] uppercase tracking-wider">
          {t("fieldCategory")}
        </label>
        <select
          name="category_slug"
          required
          defaultValue=""
          className="flex h-11 w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm focus-visible:outline-none focus-visible:border-[var(--color-accent)]"
        >
          <option value="" disabled>
            —
          </option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.emoji} {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--color-foreground-muted)] uppercase tracking-wider">
          {t("fieldBody")}
        </label>
        <Textarea
          name="body"
          required
          minLength={20}
          maxLength={50000}
          rows={14}
          placeholder={t("fieldBodyPlaceholder")}
          className="min-h-64 leading-relaxed"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--color-foreground-muted)] uppercase tracking-wider">
          {t("fieldTags")}
        </label>
        <Input
          name="tags"
          maxLength={200}
          placeholder={t("fieldTagsPlaceholder")}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--color-foreground-muted)] cursor-pointer">
        <input
          type="checkbox"
          name="is_anonymous"
          className="h-4 w-4 rounded border-[var(--color-border-strong)] bg-[var(--color-surface)] accent-[var(--color-accent)]"
        />
        {t("anonymous")}
      </label>

      {error && (
        <p className="text-sm text-[var(--color-accent)]">{error}</p>
      )}

      <Button
        type="submit"
        variant="accent"
        size="lg"
        disabled={submitting}
        className="w-full"
      >
        {submitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
