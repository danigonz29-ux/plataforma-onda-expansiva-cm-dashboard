insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'screenshots',
  'screenshots',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Screenshots upload for authenticated users" on storage.objects;
drop policy if exists "Screenshots read for authenticated users" on storage.objects;
drop policy if exists "Screenshots update own files" on storage.objects;
drop policy if exists "Screenshots delete own files" on storage.objects;

create policy "Screenshots upload for authenticated users"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'screenshots');

create policy "Screenshots read for authenticated users"
on storage.objects
for select
to authenticated
using (bucket_id = 'screenshots' and owner = auth.uid());

create policy "Screenshots update own files"
on storage.objects
for update
to authenticated
using (bucket_id = 'screenshots' and owner = auth.uid())
with check (bucket_id = 'screenshots' and owner = auth.uid());

create policy "Screenshots delete own files"
on storage.objects
for delete
to authenticated
using (bucket_id = 'screenshots' and owner = auth.uid());

select
  buckets.id as bucket_id,
  buckets.public,
  policies.policyname,
  policies.cmd,
  policies.roles
from storage.buckets
left join pg_policies as policies
  on policies.schemaname = 'storage'
  and policies.tablename = 'objects'
  and policies.policyname like 'Screenshots%'
where buckets.id = 'screenshots'
order by policies.policyname;
