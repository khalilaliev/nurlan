import { Card } from "@/components/ui/card";

export default function NewsLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-20">
      <div className="skeleton h-3 w-16 mb-4 rounded" />
      <div className="skeleton h-12 sm:h-16 w-3/4 mb-6 rounded" />
      <div className="space-y-2 mb-16">
        <div className="skeleton h-4 w-full max-w-xl rounded" />
        <div className="skeleton h-4 w-2/3 rounded" />
      </div>

      <ol className="relative space-y-6 pl-6 sm:pl-8">
        <div
          className="absolute left-2 sm:left-3 top-2 bottom-2 w-px bg-gradient-to-b from-[var(--color-border)] via-[var(--color-border)] to-transparent"
          aria-hidden
        />
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="relative">
            <div
              className="absolute -left-6 sm:-left-8 top-6 h-3 w-3 rounded-full bg-[var(--color-surface-elevated)] ring-4 ring-[var(--color-background)]"
              aria-hidden
            />
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="skeleton h-3 w-20 rounded" />
                <div className="skeleton h-1 w-1 rounded-full" />
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
              <div className="skeleton h-5 w-3/4 mb-3 rounded" />
              <div className="space-y-2">
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-11/12 rounded" />
                <div className="skeleton h-3 w-4/5 rounded" />
              </div>
            </Card>
          </li>
        ))}
      </ol>
    </div>
  );
}
