# nurlan.com

A storytelling social network. Next.js 16, Supabase, next-intl (EN/RU), Tailwind v4.

## Quick start

```powershell
cd C:\Project\nurlan
npm install
copy .env.local.example .env.local   # then fill in values
npm run dev
```

The app runs at http://localhost:3000 and redirects to `/en`.

Without `NEXT_PUBLIC_SUPABASE_URL` set, the UI renders with a setup notice instead of crashing — useful for reviewing the design before provisioning a backend.

## Provisioning Supabase

1. Create a project at https://supabase.com.
2. Settings → API: copy the **Project URL** and **anon public** key into `.env.local`.
3. SQL editor → paste the contents of `supabase/migrations/0001_init.sql` and run. This creates the schema, RLS policies, the `story_feed` view, and the `handle_new_user()` trigger that auto-creates a profile row when someone signs up.
4. Authentication → URL Configuration: add `http://localhost:3000/api/auth/callback` to the redirect allow-list (and your production URL when deploying).

## What's wired up

- **Auth**: email + password via Supabase, server actions (`src/app/actions/auth.ts`)
- **Feed**: `/[locale]` reads from the `story_feed` view, dark-first card UI
- **Story page**: `/[locale]/story/[id]` with reactions (6 emotional types), threaded comments, AI signals panel
- **Submit**: `/[locale]/submit` with categories, anonymity toggle, server-action publish
- **i18n**: `next-intl` with `/en` and `/ru` routes, full UI translation, locale switcher
- **RLS**: every table has policies — users can only mutate their own data

## What's stubbed for the next pass

- OpenAI scoring/moderation (env var is wired, calls are not yet)
- Share-card image generation (`@vercel/og` route)
- Admin panel (feature/remove/report queue)
- Reputation + badges
- Storage (image uploads)
- PostHog (key wired, init not yet)

## Project layout

```
src/
  app/
    layout.tsx                   root <html> only
    [locale]/
      layout.tsx                 nav + intl provider
      page.tsx                   feed
      submit/                    create story
      story/[id]/                story detail
      login/, signup/            auth
    api/auth/callback/           Supabase email-confirm callback
    actions/                     server actions: auth, stories, reactions, comments
  components/
    ui/                          button, input, textarea, card, badge
    nav.tsx, story-card.tsx, reaction-bar.tsx, comments.tsx, locale-switcher.tsx
  i18n/                          next-intl config (routing, request, navigation)
  lib/
    supabase/                    browser, server, middleware clients + types
    utils.ts                     cn(), relative time, reading-time
  middleware.ts                  intl + Supabase session refresh
messages/
  en.json, ru.json
supabase/migrations/
  0001_init.sql
```

## Deploying to Vercel

1. Push to GitHub.
2. Import the repo in Vercel.
3. Add the same env vars from `.env.local` to the Vercel project settings.
4. Add your production callback URL to Supabase auth redirects.
