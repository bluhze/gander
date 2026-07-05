alter table public.profiles
  add column if not exists greeting_path text;

comment on column public.profiles.greeting_path is 'Storage path for voice greeting in profile-greetings bucket';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-greetings',
  'profile-greetings',
  false,
  2097152,
  array['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "profile_greetings_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'profile-greetings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "profile_greetings_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'profile-greetings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "profile_greetings_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'profile-greetings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "profile_greetings_select_authenticated" on storage.objects
  for select to authenticated
  using (bucket_id = 'profile-greetings');
