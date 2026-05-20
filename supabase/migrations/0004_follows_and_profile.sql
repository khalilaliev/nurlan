-- Follow relationships + public profile flag.
-- Run after 0001/0002/0003.

set search_path = public;

-- ---------- profile columns ----------
alter table profiles
  add column if not exists is_profile_public boolean not null default true;

-- ---------- follows ----------
create table if not exists follows (
  follower_id  uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists follows_follower_idx
  on follows (follower_id, created_at desc);
create index if not exists follows_following_idx
  on follows (following_id, created_at desc);

-- RLS: follow lists are public; only the follower may insert or delete their
-- own row.
alter table follows enable row level security;

drop policy if exists follows_select on follows;
create policy follows_select on follows for select using (true);

drop policy if exists follows_insert on follows;
create policy follows_insert on follows for insert
  with check (auth.uid() = follower_id);

drop policy if exists follows_delete on follows;
create policy follows_delete on follows for delete
  using (auth.uid() = follower_id);
