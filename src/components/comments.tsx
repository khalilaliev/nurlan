"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatRelativeTime } from "@/lib/utils";
import { createComment } from "@/app/actions/comments";

type CommentNode = {
  id: string;
  body: string;
  author_username: string;
  is_anonymous: boolean;
  created_at: string;
  upvote_count: number;
  parent_id: string | null;
  children: CommentNode[];
};

export function Comments({
  storyId,
  comments,
  isAuthed,
}: {
  storyId: string;
  comments: CommentNode[];
  isAuthed: boolean;
}) {
  const t = useTranslations("comments");

  return (
    <div className="space-y-6">
      {isAuthed ? (
        <CommentForm storyId={storyId} />
      ) : (
        <p className="text-sm text-[var(--color-foreground-subtle)]">
          {t("placeholder")}
        </p>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-[var(--color-foreground-subtle)]">
          {t("empty")}
        </p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              storyId={storyId}
              isAuthed={isAuthed}
              depth={0}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function CommentForm({
  storyId,
  parentId,
  onDone,
}: {
  storyId: string;
  parentId?: string;
  onDone?: () => void;
}) {
  const t = useTranslations("comments");
  const [submitting, setSubmitting] = useState(false);
  const [body, setBody] = useState("");

  return (
    <form
      action={async (fd) => {
        setSubmitting(true);
        fd.set("story_id", storyId);
        if (parentId) fd.set("parent_id", parentId);
        fd.set("body", body);
        const res = await createComment(fd);
        setSubmitting(false);
        if (!res || "ok" in res) {
          setBody("");
          onDone?.();
        }
      }}
      className="space-y-2"
    >
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t("placeholder")}
        className="min-h-20"
        required
        minLength={1}
        maxLength={5000}
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="accent"
          size="sm"
          disabled={submitting || body.trim().length === 0}
        >
          {t("submit")}
        </Button>
      </div>
    </form>
  );
}

function CommentItem({
  comment,
  storyId,
  isAuthed,
  depth,
}: {
  comment: CommentNode;
  storyId: string;
  isAuthed: boolean;
  depth: number;
}) {
  const t = useTranslations("comments");
  const locale = useLocale();
  const [replying, setReplying] = useState(false);

  return (
    <li
      className="border-l border-[var(--color-border)] pl-4"
      style={{ marginLeft: depth * 8 }}
    >
      <div className="flex items-baseline gap-2 mb-1 text-xs">
        <span className="font-medium text-[var(--color-foreground)]">
          {comment.is_anonymous ? "Anonymous" : `@${comment.author_username}`}
        </span>
        <span className="text-[var(--color-foreground-subtle)]">
          {formatRelativeTime(comment.created_at, locale)}
        </span>
      </div>
      <p className="text-sm text-[var(--color-foreground-muted)] whitespace-pre-wrap leading-relaxed">
        {comment.body}
      </p>
      <div className="mt-1 flex items-center gap-3 text-xs text-[var(--color-foreground-subtle)]">
        <span>▲ {comment.upvote_count}</span>
        {isAuthed && (
          <button
            type="button"
            onClick={() => setReplying((v) => !v)}
            className="hover:text-[var(--color-foreground)]"
          >
            {t("reply")}
          </button>
        )}
      </div>
      {replying && (
        <div className="mt-3">
          <CommentForm
            storyId={storyId}
            parentId={comment.id}
            onDone={() => setReplying(false)}
          />
        </div>
      )}
      {comment.children.length > 0 && (
        <ul className="mt-3 space-y-3">
          {comment.children.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              storyId={storyId}
              isAuthed={isAuthed}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
