import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative mx-auto flex min-h-[80vh] max-w-3xl flex-col items-center justify-center px-4 sm:px-6 py-16 text-center overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
        aria-hidden
      >
        <span className="text-[clamp(18rem,55vw,42rem)] font-bold leading-none gradient-text opacity-25 select-none tracking-tighter">
          404
        </span>
      </div>

      <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-[var(--color-foreground-muted)]">
        404
      </p>

      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight gradient-text mb-6 relative">
        This page wandered off.
      </h1>

      <Link
        href="/"
        className="relative inline-flex items-center justify-center h-12 px-6 rounded-[var(--radius)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)] text-sm font-medium shadow-[var(--shadow-glow)] hover:brightness-110 transition-all"
      >
        Back home
      </Link>
    </div>
  );
}
