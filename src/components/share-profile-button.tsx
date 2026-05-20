"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareProfileButton() {
  const t = useTranslations("profile");
  const [copied, setCopied] = useState(false);

  const handle = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    try {
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function"
      ) {
        // On mobile, prefer the native share sheet when available.
        await navigator.share({ url });
        return;
      }
    } catch {
      // User cancelled the share sheet — fall through to clipboard.
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked — there's nothing else to fall back to.
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="md"
      onClick={handle}
      aria-label={t("share")}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          {t("shareCopied")}
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          {t("share")}
        </>
      )}
    </Button>
  );
}
