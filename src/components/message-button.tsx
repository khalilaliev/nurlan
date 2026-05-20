"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MessageButton() {
  const t = useTranslations("profile");
  const [tooltip, setTooltip] = useState(false);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="md"
        onClick={() => {
          setTooltip(true);
          setTimeout(() => setTooltip(false), 2200);
        }}
      >
        <MessageSquare className="h-4 w-4" />
        {t("message")}
      </Button>
      {tooltip && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-foreground-muted)] shadow-lg">
          {t("messageComingSoon")}
        </div>
      )}
    </div>
  );
}
