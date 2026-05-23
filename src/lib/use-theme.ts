"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

function readTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  const current = document.documentElement.dataset.theme;
  if (current === "light" || current === "dark") return current;
  // Fall back to localStorage (the inline script in <head> usually wrote
  // it already, but be defensive).
  const stored =
    typeof window !== "undefined" ? window.localStorage.getItem("theme") : null;
  if (stored === "light" || stored === "dark") return stored;
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: light)").matches
  ) {
    return "light";
  }
  return "dark";
}

/**
 * Shared theme state across the app.
 *
 * Returns `[theme, setTheme]`. Calling `setTheme` writes the choice to
 * `<html data-theme>` and `localStorage`. A `MutationObserver` watches the
 * `data-theme` attribute on the root element, so any other component that
 * calls this hook stays automatically in sync — no event bus, no context
 * provider needed.
 *
 * Before mount we return `null` so consumers can choose whether to render
 * theme-dependent UI (icon, ring color, etc.) at all on the server, avoiding
 * a hydration mismatch when SSR'd HTML disagrees with the client's chosen
 * theme.
 */
export function useTheme(): [Theme | null, (next: Theme) => void] {
  const [theme, setThemeState] = useState<Theme | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setThemeState(readTheme());

    const html = document.documentElement;
    const observer = new MutationObserver(() => {
      const current = html.dataset.theme;
      if (current === "light" || current === "dark") {
        setThemeState(current);
      }
    });
    observer.observe(html, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const setTheme = (next: Theme) => {
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem("theme", next);
    } catch {
      // localStorage might be disabled (private mode, quota); the data-theme
      // attribute change is still picked up by the observer, so the UI updates
      // even if persistence fails.
    }
  };

  return [theme, setTheme];
}
