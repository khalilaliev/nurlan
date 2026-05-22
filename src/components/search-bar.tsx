"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Search, X, Loader2 } from "lucide-react";
import gsap from "gsap";
import { searchStories, type SearchResult } from "@/app/actions/search";

export function SearchBar() {
  const t = useTranslations("nav");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Shorten the placeholder on small phones so the input doesn't show
  // an awkwardly truncated string in the limited space between the logo
  // and the burger menu.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 479px)");
    const update = () => setIsNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Animate dropdown open/close
  useEffect(() => {
    if (!dropdownRef.current) return;
    if (open) {
      gsap.fromTo(
        dropdownRef.current,
        { opacity: 0, y: -8, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.25,
          ease: "power3.out",
        },
      );
    }
  }, [open]);

  // Debounced search
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      startTransition(async () => {
        const data = await searchStories(q);
        setResults(data);
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Keyboard: Esc closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const showHint = open && query.trim().length > 0 && query.trim().length < 2;
  const showResults = open && results.length > 0;
  const showEmpty =
    open && !pending && query.trim().length >= 2 && results.length === 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-foreground-subtle)]"
          aria-hidden
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={
            isNarrow ? t("searchPlaceholderShort") : t("searchPlaceholder")
          }
          aria-label={t("search")}
          className="h-10 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-10 text-base sm:text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-subtle)] focus-visible:outline-none focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent-soft)] transition-colors"
        />
        {pending ? (
          <Loader2 className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-foreground-subtle)] animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full flex items-center justify-center text-[var(--color-foreground-subtle)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-elevated)] transition-colors"
            aria-label="Clear"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {(showResults || showEmpty || showHint) && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full mt-2 z-50 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden"
        >
          {showHint && (
            <p className="px-4 py-3 text-sm text-[var(--color-foreground-subtle)]">
              {t("searchHint")}
            </p>
          )}
          {showEmpty && (
            <p className="px-4 py-3 text-sm text-[var(--color-foreground-subtle)]">
              {t("searchEmpty")}
            </p>
          )}
          {showResults && (
            <ul className="max-h-80 overflow-y-auto">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                      router.push(`/story/${r.id}`);
                    }}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[var(--color-surface-elevated)] transition-colors"
                  >
                    <span
                      className="shrink-0 text-base"
                      aria-hidden
                    >
                      {r.category_emoji ?? "📝"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {r.title}
                      </div>
                      <div className="text-xs text-[var(--color-foreground-subtle)] mt-0.5">
                        {t("searchBy")}{" "}
                        {r.is_anonymous
                          ? "anonymous"
                          : `@${r.author_username}`}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
