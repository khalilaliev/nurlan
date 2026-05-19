-- Storage RLS policies for the 'story-media' bucket.
-- Prerequisite: create the bucket in Supabase Dashboard → Storage → New bucket
--   - Name: story-media
--   - Public bucket: ON
-- Then run this migration.
--
-- Layout convention: every uploaded file lives under a folder named after the
-- uploader's auth.users.id, e.g. `{uuid}/{timestamp}-{name}.jpg`. This makes
-- ownership trivial: the first path segment IS the owner.

set search_path = public;

-- Public read for anything in story-media.
drop policy if exists "story_media_public_read" on storage.objects;
create policy "story_media_public_read"
on storage.objects for select
to public
using (bucket_id = 'story-media');

-- Authenticated users can upload only into their own folder.
drop policy if exists "story_media_user_upload" on storage.objects;
create policy "story_media_user_upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'story-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can delete only files in their own folder.
drop policy if exists "story_media_user_delete" on storage.objects;
create policy "story_media_user_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'story-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can update (overwrite) only files in their own folder.
drop policy if exists "story_media_user_update" on storage.objects;
create policy "story_media_user_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'story-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);
