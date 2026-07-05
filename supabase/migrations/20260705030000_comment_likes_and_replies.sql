alter table public.post_comments
  add column if not exists parent_id uuid references public.post_comments(id) on delete cascade;

create index if not exists post_comments_parent_id_idx on public.post_comments (parent_id);

create table if not exists public.comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.post_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);

create index if not exists comment_likes_comment_id_idx on public.comment_likes (comment_id);

alter table public.comment_likes enable row level security;

create policy "comment_likes_select" on public.comment_likes
  for select using (true);

create policy "comment_likes_insert" on public.comment_likes
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "comment_likes_delete" on public.comment_likes
  for delete to authenticated
  using (auth.uid() = user_id);
