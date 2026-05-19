import { Card } from "@/components/ui/card";

export function SetupNotice() {
  return (
    <Card className="p-6 border-dashed">
      <h3 className="text-base font-semibold mb-2">Almost there.</h3>
      <p className="text-sm text-[var(--color-foreground-muted)] leading-relaxed">
        Supabase is not configured yet. The UI renders fine, but the feed,
        auth, and reactions need credentials before they do anything useful.
      </p>
      <ol className="mt-3 text-sm text-[var(--color-foreground-muted)] list-decimal pl-5 space-y-1">
        <li>
          Create a Supabase project at{" "}
          <span className="font-mono text-[var(--color-foreground)]">
            supabase.com
          </span>
          .
        </li>
        <li>
          Paste the URL and anon key into{" "}
          <span className="font-mono text-[var(--color-foreground)]">
            .env.local
          </span>{" "}
          (see{" "}
          <span className="font-mono text-[var(--color-foreground)]">
            .env.local.example
          </span>
          ).
        </li>
        <li>
          Run the migration in{" "}
          <span className="font-mono text-[var(--color-foreground)]">
            supabase/migrations/0001_init.sql
          </span>{" "}
          (paste into the SQL editor or use the Supabase CLI).
        </li>
        <li>Restart the dev server.</li>
      </ol>
    </Card>
  );
}
