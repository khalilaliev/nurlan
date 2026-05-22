-- Inbox tables — capture newsletter signups and contact form submissions.
-- Both are "leads": anonymous-friendly inserts, admin-only reads.
--
-- We deliberately don't wire these to an email service yet. Step 1 is to
-- collect the data reliably and let the admin see it in /account/admin
-- (future work) or via Supabase Table Editor. Step 2 (later) is to forward
-- to Resend / SendGrid / etc.

set search_path = public;

-- ---------- newsletter_subscribers ----------
create table if not exists newsletter_subscribers (
  id            uuid primary key default gen_random_uuid(),
  email         citext not null unique,
  -- nullable: someone might subscribe without being signed in
  user_id       uuid references profiles(id) on delete set null,
  locale        text not null default 'en' check (locale in ('en', 'ru')),
  source        text,
  created_at    timestamptz not null default now()
);

create index if not exists newsletter_subscribers_created_at_idx
  on newsletter_subscribers (created_at desc);

-- ---------- contact_messages ----------
create table if not exists contact_messages (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 1 and 120),
  email         citext not null,
  subject       text check (subject is null or char_length(subject) between 1 and 200),
  body          text not null check (char_length(body) between 10 and 5000),
  user_id       uuid references profiles(id) on delete set null,
  locale        text not null default 'en' check (locale in ('en', 'ru')),
  -- Lightweight intake state. Defaults to 'new'; admin moves through.
  status        text not null default 'new' check (status in ('new', 'replied', 'closed')),
  created_at    timestamptz not null default now()
);

create index if not exists contact_messages_status_idx
  on contact_messages (status, created_at desc);

-- ---------- RLS ----------
-- Anyone (anon or authenticated) can INSERT. Nobody can SELECT or modify
-- unless they're an admin. The is_admin() helper was created in 0002.
alter table newsletter_subscribers enable row level security;
alter table contact_messages       enable row level security;

drop policy if exists newsletter_insert on newsletter_subscribers;
create policy newsletter_insert on newsletter_subscribers for insert
  with check (true);

drop policy if exists newsletter_admin_select on newsletter_subscribers;
create policy newsletter_admin_select on newsletter_subscribers for select
  using (is_admin());

drop policy if exists contact_insert on contact_messages;
create policy contact_insert on contact_messages for insert
  with check (true);

drop policy if exists contact_admin_select on contact_messages;
create policy contact_admin_select on contact_messages for select
  using (is_admin());

drop policy if exists contact_admin_update on contact_messages;
create policy contact_admin_update on contact_messages for update
  using (is_admin());
