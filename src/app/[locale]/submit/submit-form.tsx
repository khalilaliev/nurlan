"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RulesModal } from "@/components/rules-modal";
import {
  MediaUploader,
  urlsToMedia,
  type UploadedMedia,
} from "@/components/media-uploader";
import { createStory } from "@/app/actions/stories";

// Draft is scoped per-user so User B can't see User A's in-progress story
// (which included media URLs in User A's private storage folder).
function draftKey(userId: string) {
  return `nurlan:submit-draft:${userId}`;
}

// One-time migration: wipe the old global key so leftover drafts from before
// per-user scoping don't appear for whoever logs in next.
const LEGACY_KEY = "nurlan:submit-draft";

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
  const [mediaHasErrors, setMediaHasErrors] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      // Clean up any pre-scoping leftover so it never bleeds into another user.
      localStorage.removeItem(LEGACY_KEY);
      const raw = localStorage.getItem(draftKey(userId));
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
  }, [userId]);
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
        localStorage.removeItem(draftKey(userId));
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
      localStorage.setItem(draftKey(userId), JSON.stringify(draft));
    } catch {
      // localStorage quota or disabled
    }
  }, [restored, title, body, category, tags, isAnonymous, media, userId]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(draftKey(userId));
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
    // Radix Select's `required` prop is a no-op for HTML form validation
    // (it has no underlying native input). Guard explicitly so we don't
    // round-trip to the server only to fail Zod validation.
    if (!category) {
      setError(t("fieldCategoryRequired"));
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await createStory(buildFormData());
    setSubmitting(false);
    if (res && "error" in res && res.error) {
      const key = res.error as "errorAuth" | "errorGeneric" | "errorBadMedia";
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
        <Select value={category} onValueChange={setCategory} required>
          <SelectTrigger leadingIcon={<Tag />}>
            <SelectValue placeholder={t("fieldCategory")} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            onErrorChange={setMediaHasErrors}
          />
        )}
        {mediaHasErrors && (
          <p className="text-xs text-[var(--color-accent)]">
            {t("mediaBlockedSubmit")}
          </p>
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
          disabled={submitting || mediaHasErrors}
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
