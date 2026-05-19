-- nurlan.com initial schema
-- Run with: supabase db push  (or paste into Supabase SQL editor)

set search_path = public;

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------- profiles ----------
-- 1:1 with auth.users. We never write directly to auth.users.
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      citext unique not null,
  display_name  text,
  avatar_url    text,
  bio           text,
  reputation    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists profiles_username_idx on profiles (username);

-- ---------- categories ----------
create table if not exists categories (
  slug          text primary key,
  name_en       text not null,
  name_ru       text not null,
  emoji         text,
  display_order integer not null default 0
);

insert into categories (slug, name_en, name_ru, emoji, display_order) values
  ('life',          'Life Stories',          'Истории из жизни',           '🌱', 10),
  ('relationships', 'Relationship Stories',  'Отношения',                  '💔', 20),
  ('school',        'School Stories',        'Школа',                      '🎒', 30),
  ('work',          'Work Stories',          'Работа',                     '💼', 40),
  ('cringe',        'Cringe Stories',        'Кринж',                      '😬', 50),
  ('horror',        'Horror Stories',        'Хоррор',                     '👻', 60),
  ('weird',         'Conspiracy / Weird',    'Странное / Конспирология',   '🛸', 70)
on conflict (slug) do nothing;

-- ---------- stories ----------
create type story_status as enum ('published', 'flagged', 'removed', 'draft');

create table if not exists stories (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references profiles(id) on delete cascade,
  title         text not null check (char_length(title) between 3 and 200),
  body          text not null check (char_length(body) between 20 and 50000),
  category_slug text not null references categories(slug),
  tags          text[] not null default '{}',
  is_anonymous  boolean not null default false,
  status        story_status not null default 'published',
  media_urls    text[] not null default '{}',
  ai_score      jsonb,
  view_count    integer not null default 0,
  is_featured   boolean not null default false,
  language      text not null default 'en' check (language in ('en', 'ru')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists stories_created_at_idx on stories (created_at desc);
create index if not exists stories_category_idx   on stories (category_slug, created_at desc);
create index if not exists stories_author_idx     on stories (author_id, created_at desc);
create index if not exists stories_status_idx     on stories (status) where status = 'published';

-- ---------- reactions ----------
create type reaction_type as enum ('funny', 'insane', 'sad', 'cringe', 'mindblown', 'viral');

create table if not exists reactions (
  id         uuid primary key default gen_random_uuid(),
  story_id   uuid not null references stories(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  type       reaction_type not null,
  created_at timestamptz not null default now(),
  unique (story_id, user_id, type)
);

create index if not exists reactions_story_idx on reactions (story_id, type);

-- ---------- comments ----------
create table if not exists comments (
  id            uuid primary key default gen_random_uuid(),
  story_id      uuid not null references stories(id) on delete cascade,
  parent_id     uuid references comments(id) on delete cascade,
  author_id     uuid not null references profiles(id) on delete cascade,
  body          text not null check (char_length(body) between 1 and 5000),
  is_anonymous  boolean not null default false,
  is_pinned     boolean not null default false,
  upvote_count  integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists comments_story_idx  on comments (story_id, created_at);
create index if not exists comments_parent_idx on comments (parent_id);

-- ---------- comment votes ----------
create table if not exists comment_votes (
  comment_id uuid not null references comments(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  vote       smallint not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

-- Keep `comments.upvote_count` in sync with `comment_votes`.
create or replace function recount_comment_votes()
returns trigger language plpgsql as $$
declare target_id uuid;
begin
  target_id := coalesce(new.comment_id, old.comment_id);
  update comments
     set upvote_count = coalesce((
       select sum(vote)::int from comment_votes where comment_id = target_id
     ), 0)
   where id = target_id;
  return null;
end;
$$;

drop trigger if exists comment_votes_recount on comment_votes;
create trigger comment_votes_recount
after insert or update or delete on comment_votes
for each row execute function recount_comment_votes();

-- ---------- reports ----------
create table if not exists reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references profiles(id) on delete cascade,
  story_id     uuid references stories(id) on delete cascade,
  comment_id   uuid references comments(id) on delete cascade,
  reason       text not null,
  status       text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at   timestamptz not null default now(),
  check (story_id is not null or comment_id is not null)
);

-- ---------- profile auto-creation ----------
-- When a new auth user signs up, create a matching profile row.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_username text;
  candidate     text;
  suffix        int := 0;
begin
  base_username := lower(
    coalesce(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1),
      'user'
    )
  );
  base_username := regexp_replace(base_username, '[^a-z0-9_]', '', 'g');
  if base_username = '' then base_username := 'user'; end if;

  candidate := base_username;
  while exists (select 1 from profiles where username = candidate) loop
    suffix := suffix + 1;
    candidate := base_username || suffix::text;
  end loop;

  insert into profiles (id, username, display_name)
  values (new.id, candidate, coalesce(new.raw_user_meta_data->>'display_name', candidate));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- ---------- feed view ----------
-- Single query for the feed card: respects anonymity, includes counts.
create or replace view story_feed as
select
  s.id,
  s.title,
  s.body,
  s.category_slug,
  c.name_en           as category_name_en,
  c.name_ru           as category_name_ru,
  c.emoji             as category_emoji,
  s.tags,
  s.is_anonymous,
  s.status,
  s.media_urls,
  s.ai_score,
  s.view_count,
  s.is_featured,
  s.language,
  s.created_at,
  case when s.is_anonymous then null else s.author_id end as author_id,
  case when s.is_anonymous then 'Anonymous' else p.username::text end as author_username,
  case when s.is_anonymous then null else p.avatar_url end as author_avatar,
  coalesce((select count(*) from reactions r where r.story_id = s.id), 0) as reaction_total,
  coalesce((select count(*) from comments  k where k.story_id = s.id), 0) as comment_count,
  coalesce((
    select jsonb_object_agg(type, cnt)
    from (
      select type, count(*)::int as cnt
      from reactions
      where story_id = s.id
      group by type
    ) t
  ), '{}'::jsonb) as reaction_breakdown
from stories s
join profiles p on p.id = s.author_id
join categories c on c.slug = s.category_slug
where s.status = 'published';

-- ---------- RLS ----------
alter table profiles      enable row level security;
alter table stories       enable row level security;
alter table reactions     enable row level security;
alter table comments      enable row level security;
alter table comment_votes enable row level security;
alter table reports       enable row level security;
alter table categories    enable row level security;

-- profiles: readable by anyone, writable by self
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select using (true);

drop policy if exists profiles_insert on profiles;
create policy profiles_insert on profiles for insert with check (auth.uid() = id);

drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles for update using (auth.uid() = id);

-- categories: read-only to clients
drop policy if exists categories_select on categories;
create policy categories_select on categories for select using (true);

-- stories: read published, write own
drop policy if exists stories_select on stories;
create policy stories_select on stories for select
  using (status = 'published' or author_id = auth.uid());

drop policy if exists stories_insert on stories;
create policy stories_insert on stories for insert
  with check (auth.uid() = author_id);

drop policy if exists stories_update on stories;
create policy stories_update on stories for update
  using (auth.uid() = author_id);

drop policy if exists stories_delete on stories;
create policy stories_delete on stories for delete
  using (auth.uid() = author_id);

-- reactions: read all, write own
drop policy if exists reactions_select on reactions;
create policy reactions_select on reactions for select using (true);

drop policy if exists reactions_insert on reactions;
create policy reactions_insert on reactions for insert
  with check (auth.uid() = user_id);

drop policy if exists reactions_delete on reactions;
create policy reactions_delete on reactions for delete
  using (auth.uid() = user_id);

-- comments: read all on published stories, write own
drop policy if exists comments_select on comments;
create policy comments_select on comments for select
  using (exists (select 1 from stories s where s.id = story_id and (s.status = 'published' or s.author_id = auth.uid())));

drop policy if exists comments_insert on comments;
create policy comments_insert on comments for insert
  with check (auth.uid() = author_id);

drop policy if exists comments_update on comments;
create policy comments_update on comments for update
  using (auth.uid() = author_id);

drop policy if exists comments_delete on comments;
create policy comments_delete on comments for delete
  using (auth.uid() = author_id);

-- comment votes: read all, write own
drop policy if exists comment_votes_select on comment_votes;
create policy comment_votes_select on comment_votes for select using (true);

drop policy if exists comment_votes_write on comment_votes;
create policy comment_votes_write on comment_votes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- reports: insert by anyone authenticated, no read for clients
drop policy if exists reports_insert on reports;
create policy reports_insert on reports for insert
  with check (auth.uid() = reporter_id);
