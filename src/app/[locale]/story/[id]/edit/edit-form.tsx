"use client";

import { useState } from "react";
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
import {
  MediaUploader,
  urlsToMedia,
  type UploadedMedia,
} from "@/components/media-uploader";
import { updateStory } from "@/app/actions/stories";

export function EditStoryForm({
  categories,
  storyId,
  userId,
  initial,
}: {
  categories: { slug: string; name: string; emoji: string }[];
  storyId: string;
  userId: string;
  initial: {
    title: string;
    body: string;
    category_slug: string;
    tags: string;
    is_anonymous: boolean;
    media_urls: string[];
  };
}) {
  const t = useTranslations("submit");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const [category, setCategory] = useState(initial.category_slug);
  const [tags, setTags] = useState(initial.tags);
  const [isAnonymous, setIsAnonymous] = useState(initial.is_anonymous);
  const [media, setMedia] = useState<UploadedMedia[]>(
    urlsToMedia(initial.media_urls),
  );
  const [mediaHasErrors, setMediaHasErrors] = useState(false);

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
    const res = await updateStory(storyId, buildFormData());
    setSubmitting(false);
    if (res && "error" in res && res.error) {
      const key = res.error as
        | "errorAuth"
        | "errorGeneric"
        | "errorForbidden"
        | "errorNotFound"
        | "errorBadMedia";
      setError(t(key));
      return;
    }
    router.push(`/story/${storyId}`);
  };

  return (
    <form
      action={async () => {
        await submit();
      }}
      className="space-y-5"
    >
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
        <MediaUploader
          userId={userId}
          initial={urlsToMedia(initial.media_urls)}
          onChange={setMedia}
          onErrorChange={setMediaHasErrors}
        />
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
          {submitting ? t("saving") : t("saveButton")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => router.push(`/story/${storyId}`)}
          disabled={submitting}
        >
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
