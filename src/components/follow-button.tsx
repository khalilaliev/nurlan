"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { UserPlus, UserCheck, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { followUser, unfollowUser } from "@/app/actions/follows";
import { cn } from "@/lib/utils";

export function FollowButton({
  targetUserId,
  initialFollowing,
  isAuthed,
}: {
  targetUserId: string;
  initialFollowing: boolean;
  isAuthed: boolean;
}) {
  const t = useTranslations("profile");
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [hovering, setHovering] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!isAuthed) {
    return (
      <Button
        variant="accent"
        size="md"
        onClick={() => router.push("/login")}
      >
        <UserPlus className="h-4 w-4" />
        {t("follow")}
      </Button>
    );
  }

  const toggle = () => {
    // Optimistic UI: flip immediately, roll back on error.
    const next = !following;
    setFollowing(next);
    startTransition(async () => {
      const res = next
        ? await followUser(targetUserId)
        : await unfollowUser(targetUserId);
      if ("error" in res) {
        setFollowing(!next);
      } else {
        router.refresh();
      }
    });
  };

  if (following) {
    return (
      <Button
        variant="outline"
        size="md"
        onClick={toggle}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        disabled={pending}
        className={cn(
          "min-w-[140px] transition-colors",
          hovering &&
            "border-[var(--color-accent)]/50 text-[var(--color-accent)] bg-[var(--color-accent-soft)]/30",
        )}
      >
        {hovering ? (
          <>
            <UserMinus className="h-4 w-4" />
            {t("unfollowHover")}
          </>
        ) : (
          <>
            <UserCheck className="h-4 w-4" />
            {t("unfollow")}
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      variant="accent"
      size="md"
      onClick={toggle}
      disabled={pending}
      className="min-w-[140px]"
    >
      <UserPlus className="h-4 w-4" />
      {t("follow")}
    </Button>
  );
}
