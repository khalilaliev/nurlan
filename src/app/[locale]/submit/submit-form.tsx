"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RulesModal } from "@/components/rules-modal";
import {
  MediaUploader,
  urlsToMedia,
  type UploadedMedia,
} from "@/components/media-uploader";
import { createStory } from "@/app/actions/stories";

const STORAGE_KEY = "nurlan:submit-draft";

type Draft = {
  title?: string;
  body?: string;
  category_slug?: string;
  tags?: string;
  is_anonymous?: boolean;
  media_urls?: string[];
};

export function SubmitForm({
  categories,
  rulesAccepted,
  userId,
}: {
  categories: { slug: string; name: string; emoji: string }[];
  rulesAccepted: boolean;
  userId: string;
}) {
  const t = useTranslations("submit");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const acceptedRef = useRef(rulesAccepted);
  const [showRules, setShowRules] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [media, setMedia] = useState<UploadedMedia[]>([]);
  const [initialMedia, setInitialMedia] = useState<UploadedMedia[] | null>(null);
  const [restored, setRestored] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as Draft;
        if (typeof draft.title === "string") setTitle(draft.title);
        if (typeof draft.body === "string") setBody(draft.body);
        if (typeof draft.category_slug === "string")
          setCategory(draft.category_slug);
        if (typeof draft.tags === "string") setTags(draft.tags);
        if (typeof draft.is_anonymous === "boolean")
          setIsAnonymous(draft.is_anonymous);
        if (Array.isArray(draft.media_urls)) {
          setInitialMedia(urlsToMedia(draft.media_urls));
        } else {
          setInitialMedia([]);
        }
      } else {
        setInitialMedia([]);
      }
    } catch {
      setInitialMedia([]);
    }
    setRestored(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!restored) return;
    try {
      const empty =
        !title &&
        !body &&
        !category &&
        !tags &&
        !isAnonymous &&
        media.length === 0;
      if (empty) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      const draft: Draft = {
        title,
        body,
        category_slug: category,
        tags,
        is_anonymous: isAnonymous,
        media_urls: media.map((m) => m.url),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // localStorage quota or disabled
    }
  }, [restored, title, body, category, tags, isAnonymous, media]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const buildFormData = (): FormData => {
    const fd = new FormData();
    fd.set("title", title);
    fd.set("body", body);
    fd.set("category_slug", category);
    fd.set("tags", tags);
    if (isAnonymous) fd.set("is_anonymous", "on");
    media.forEach((m) => fd.append("media_urls", m.url));
    return fd;
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    const res = await createStory(buildFormData());
    setSubmitting(false);
    if (res && "error" in res && res.error) {
      const key = res.error as "errorAuth" | "errorGeneric";
      setError(t(key));
      return;
    }
    if (res && "id" in res && typeof res.id === "string") {
      clearDraft();
      router.push(`/story/${res.id}`);
    }
  };

  const handleClear = () => {
    setTitle("");
    setBody("");
    setCategory("");
    setTags("");
    setIsAnonymous(false);
    setMedia([]);
    setInitialMedia([]);
    clearDraft();
  };

  return (
    <form
      action={async () => {
        if (!acceptedRef.current) {
          setShowRules(true);
          return;
        }
        await submit();
      }}
      className="space-y-5"
    >
      <RulesModal
        open={showRules}
        onCancel={() => setShowRules(false)}
        onAccepted={() => {
          acceptedRef.current = true;
          setShowRules(false);
          void submit();
        }}
      />

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--color-foreground-muted)] uppercase tracking-wider">
          {t("fieldTitle")}
        </label>
        <Input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
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
          value={body}
          onChange={(e) => setBody(e.target.value)}
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
          {t("media")}
        </label>
        {initialMedia !== null && (
          <MediaUploader
            userId={userId}
            initial={initialMedia}
            onChange={setMedia}
          />
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--color-foreground-muted)] uppercase tracking-wider">
          {t("fieldTags")}
        </label>
        <Input
          name="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          maxLength={200}
          placeholder={t("fieldTagsPlaceholder")}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--color-foreground-muted)] cursor-pointer">
        <input
          type="checkbox"
          name="is_anonymous"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          className="h-4 w-4 rounded border-[var(--color-border-strong)] bg-[var(--color-surface)] accent-[var(--color-accent)]"
        />
        {t("anonymous")}
      </label>

      {error && <p className="text-sm text-[var(--color-accent)]">{error}</p>}

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          variant="accent"
          size="lg"
          disabled={submitting}
          className="flex-1"
        >
          {submitting ? t("submitting") : t("submit")}
        </Button>
        {(title ||
          body ||
          category ||
          tags ||
          isAnonymous ||
          media.length > 0) && (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={handleClear}
            disabled={submitting}
          >
            ✕
          </Button>
        )}
      </div>
    </form>
  );
}
