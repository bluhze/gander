alter table public.post_comments
  add column if not exists audio_path text;

alter table public.post_comments
  alter column body drop not null;

alter table public.post_comments
  drop constraint if exists post_comments_content_check;

alter table public.post_comments
  add constraint post_comments_content_check
  check (
    (body is not null and length(trim(body)) > 0)
    or (audio_path is not null and length(trim(audio_path)) > 0)
  );

comment on column public.post_comments.audio_path is 'Storage path for voice reply in comment-audio bucket';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'comment-audio',
  'comment-audio',
  false,
  2097152,
  array['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "comment_audio_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'comment-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "comment_audio_select_authenticated" on storage.objects
  for select to authenticated
  using (bucket_id = 'comment-audio');

create policy "comment_audio_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'comment-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
