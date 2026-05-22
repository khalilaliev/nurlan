-- Story views — count each user once per story.
--
-- The stories table already has a `view_count` integer column from migration
-- 0001. This migration adds:
--   1. A `story_views` join table that records (story_id, viewer_id) with a
--      composite unique constraint so the same user can't double-count.
--   2. A trigger that bumps `stories.view_count` by 1 on every successful
--      insert into story_views.
--   3. RLS so users can only insert their own view rows.
--
-- The server action calls `insert ... on conflict do nothing` — repeat views
-- by the same user become silent no-ops, so the trigger only fires once per
-- (story, user) pair. Anonymous viewers are excluded (no auth.uid()).

set search_path = public;

create table if not exists story_views (
  story_id   uuid not null references stories(id) on delete cascade,
  viewer_id  uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);

create index if not exists story_views_story_idx
  on story_views (story_id);

-- Increment the denormalised view_count column whenever a NEW row appears.
-- (Conflict-do-nothing inserts skip the trigger, which is exactly what we
-- want — they're not new rows.)
create or replace function bump_story_view_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update stories
     set view_count = view_count + 1
   where id = new.story_id;
  return new;
end;
$$;

drop trigger if exists story_views_bump on story_views;
create trigger story_views_bump
after insert on story_views
for each row execute function bump_story_view_count();

-- RLS: any authenticated user can record their own view; nobody can read
-- the join table directly (privacy — we don't need to expose "who viewed
-- what"; the denormalised count on stories is enough).
alter table story_views enable row level security;

drop policy if exists story_views_insert on story_views;
create policy story_views_insert on story_views for insert
  with check (auth.uid() = viewer_id);

-- Admins can read for audit if needed.
drop policy if exists story_views_admin_select on story_views;
create policy story_views_admin_select on story_views for select
  using (is_admin());
