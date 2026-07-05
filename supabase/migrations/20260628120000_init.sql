-- Gander — initial schema
--
-- Safety/privacy is architectural here, not bolted on:
--   * Raw coordinates are NEVER stored. update_my_location() fuzzes on write and
--     only the fuzzed point is persisted — you can't leak what you don't keep.
--   * Distance is the only geo signal ever returned, and only via nearby_profiles(),
--     coarsely bucketed. Two layers (grid snap + per-user jitter on write, bucket on
--     read) defend against trilateration.
--   * Every table has RLS enabled. user_locations is owner-only. verifications is
--     service-role-only so users cannot self-verify.

-- PostGIS lives in its own schema, out of the exposed API surface (keeps
-- spatial_ref_sys and PostGIS internals off /rest/v1).
create schema if not exists extensions;
create extension if not exists postgis with schema extensions;

set search_path = public, extensions, pg_temp;

-- Private schema for SECURITY DEFINER helpers (never exposed via the Data API).
create schema if not exists app;
revoke all on schema app from anon, authenticated;

-- ============================================================================
-- Tables
-- ============================================================================

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null check (char_length(display_name) between 1 and 50),
  bio           text check (char_length(bio) <= 500),
  birthdate     date not null,
  attributes    jsonb not null default '{}'::jsonb,
  show_distance boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  constraint adult_only check (birthdate <= (current_date - interval '18 years'))
);

create table public.profile_photos (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  position     smallint not null default 0,
  is_primary   boolean not null default false,
  created_at   timestamptz not null default now()
);
create index profile_photos_profile_idx on public.profile_photos (profile_id);

-- Fuzzed location only. Clients never write here directly (no write RLS policies);
-- the only writer is update_my_location().
create table public.user_locations (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  geog       extensions.geography(Point, 4326) not null,
  updated_at timestamptz not null default now()
);
create index user_locations_geog_idx on public.user_locations using gist (geog);

create table public.likes (
  liker_id    uuid not null references public.profiles (id) on delete cascade,
  liked_id    uuid not null references public.profiles (id) on delete cascade,
  is_favorite boolean not null default false,
  created_at  timestamptz not null default now(),
  primary key (liker_id, liked_id),
  check (liker_id <> liked_id)
);
create index likes_liked_idx on public.likes (liked_id);

create table public.messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  body         text check (char_length(body) <= 4000),
  image_path   text,
  created_at   timestamptz not null default now(),
  read_at      timestamptz,
  check (sender_id <> recipient_id),
  check (body is not null or image_path is not null)
);
create index messages_pair_idx on public.messages (sender_id, recipient_id, created_at desc);
create index messages_recipient_unread_idx on public.messages (recipient_id) where read_at is null;

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_id uuid not null references public.profiles (id) on delete cascade,
  reason      text not null,
  details     text check (char_length(details) <= 2000),
  status      text not null default 'open' check (status in ('open','reviewing','actioned','dismissed')),
  created_at  timestamptz not null default now(),
  check (reporter_id <> reported_id)
);
create index reports_status_idx on public.reports (status);

-- Written only by the KYC webhook (service role). Users can read their own status.
create table public.verifications (
  profile_id        uuid primary key references public.profiles (id) on delete cascade,
  age_verified      boolean not null default false,
  identity_verified boolean not null default false,
  vendor            text,
  vendor_ref        text,
  verified_at       timestamptz,
  updated_at        timestamptz not null default now()
);

-- ============================================================================
-- Helpers (private schema, SECURITY DEFINER)
-- ============================================================================

-- Symmetric block check used by RLS policies and discovery.
create or replace function app.is_blocked(viewer uuid, target uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = viewer and blocked_id = target)
       or (blocker_id = target and blocked_id = viewer)
  );
$$;

-- Deterministic fuzzing: snap to a ~165m grid, then add a per-user fixed jitter.
-- Per-user jitter is stable so repeated queries can't be averaged out to recover
-- the true point.
create or replace function app.fuzz_location(p_profile uuid, p_lat double precision, p_lng double precision)
returns extensions.geography
language plpgsql
immutable
set search_path = public, extensions, pg_temp
as $$
declare
  grid_deg double precision := 0.0015;
  seed1 double precision := ('x' || substr(md5(p_profile::text), 1, 8))::bit(32)::bigint::double precision / 4294967295.0;
  seed2 double precision := ('x' || substr(md5(p_profile::text), 9, 8))::bit(32)::bigint::double precision / 4294967295.0;
  jlat  double precision := (seed1 - 0.5) * grid_deg;
  jlng  double precision := (seed2 - 0.5) * grid_deg;
  slat  double precision := round(p_lat / grid_deg) * grid_deg + jlat;
  slng  double precision := round(p_lng / grid_deg) * grid_deg + jlng;
begin
  return ST_SetSRID(ST_MakePoint(slng, slat), 4326)::extensions.geography;
end;
$$;

create or replace function app.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function app.touch_updated_at();

create trigger verifications_touch_updated_at
  before update on public.verifications
  for each row execute function app.touch_updated_at();

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.profiles       enable row level security;
alter table public.profile_photos enable row level security;
alter table public.user_locations enable row level security;
alter table public.likes          enable row level security;
alter table public.messages       enable row level security;
alter table public.blocks         enable row level security;
alter table public.reports        enable row level security;
alter table public.verifications  enable row level security;

-- profiles: self always; others only if not blocked either direction.
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or not app.is_blocked(auth.uid(), id));
create policy profiles_insert on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- profile_photos: visible with the owning profile; writable only by owner.
create policy profile_photos_select on public.profile_photos for select to authenticated
  using (profile_id = auth.uid() or not app.is_blocked(auth.uid(), profile_id));
create policy profile_photos_insert on public.profile_photos for insert to authenticated
  with check (profile_id = auth.uid());
create policy profile_photos_update on public.profile_photos for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy profile_photos_delete on public.profile_photos for delete to authenticated
  using (profile_id = auth.uid());

-- user_locations: owner-only read. No write policies — only update_my_location() writes.
create policy user_locations_select on public.user_locations for select to authenticated
  using (profile_id = auth.uid());

-- likes: see likes you sent or received; manage only your own.
create policy likes_select on public.likes for select to authenticated
  using (liker_id = auth.uid() or liked_id = auth.uid());
create policy likes_insert on public.likes for insert to authenticated
  with check (liker_id = auth.uid() and not app.is_blocked(auth.uid(), liked_id));
create policy likes_update on public.likes for update to authenticated
  using (liker_id = auth.uid()) with check (liker_id = auth.uid());
create policy likes_delete on public.likes for delete to authenticated
  using (liker_id = auth.uid());

-- messages: read your own threads; send only as yourself and only if not blocked.
-- read_at is set via mark_messages_read() (no UPDATE policy => no body tampering).
create policy messages_select on public.messages for select to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy messages_insert on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and not app.is_blocked(auth.uid(), recipient_id));
create policy messages_delete on public.messages for delete to authenticated
  using (sender_id = auth.uid());

-- blocks: manage only your own.
create policy blocks_select on public.blocks for select to authenticated
  using (blocker_id = auth.uid());
create policy blocks_insert on public.blocks for insert to authenticated
  with check (blocker_id = auth.uid());
create policy blocks_delete on public.blocks for delete to authenticated
  using (blocker_id = auth.uid());

-- reports: file and read your own. Moderation reads via service role (bypasses RLS).
create policy reports_select on public.reports for select to authenticated
  using (reporter_id = auth.uid());
create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());

-- verifications: read-only for the owner. No write policies => service role only.
create policy verifications_select on public.verifications for select to authenticated
  using (profile_id = auth.uid());

-- ============================================================================
-- RPCs (public so they're callable; SECURITY DEFINER with pinned search_path)
-- ============================================================================

-- Fuzzes and stores the caller's location. Raw coordinates are discarded.
create or replace function public.update_my_location(lat double precision, lng double precision)
returns void
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  fuzzed extensions.geography;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if lat < -90 or lat > 90 or lng < -180 or lng > 180 then
    raise exception 'invalid coordinates';
  end if;
  fuzzed := app.fuzz_location(auth.uid(), lat, lng);
  insert into public.user_locations (profile_id, geog, updated_at)
  values (auth.uid(), fuzzed, now())
  on conflict (profile_id) do update
    set geog = excluded.geog, updated_at = now();
end;
$$;

-- Distance-sorted discovery. Returns coarse distance only (rounded to 500m),
-- never coordinates. Excludes self and blocked users (both directions).
create or replace function public.nearby_profiles(
  max_results      integer default 60,
  max_distance_m   double precision default 160000
)
returns table (
  id                 uuid,
  display_name       text,
  bio                text,
  primary_photo_path text,
  distance_m         double precision,
  last_active_at     timestamptz
)
language plpgsql
security definer
set search_path = public, extensions, pg_temp
stable
as $$
declare
  me extensions.geography;
begin
  select geog into me from public.user_locations where profile_id = auth.uid();
  if me is null then
    return;
  end if;

  return query
  select
    p.id,
    p.display_name,
    p.bio,
    (select pp.storage_path
       from public.profile_photos pp
      where pp.profile_id = p.id
      order by pp.is_primary desc, pp.position asc
      limit 1),
    round(ST_Distance(me, l.geog) / 500.0) * 500.0,
    p.last_active_at
  from public.profiles p
  join public.user_locations l on l.profile_id = p.id
  where p.id <> auth.uid()
    and not app.is_blocked(auth.uid(), p.id)
    and ST_DWithin(me, l.geog, max_distance_m)
  order by ST_Distance(me, l.geog) asc
  limit greatest(1, least(max_results, 200));
end;
$$;

-- Marks received messages as read. Scoped to the caller as recipient.
create or replace function public.mark_messages_read(message_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.messages
     set read_at = now()
   where id = any(message_ids)
     and recipient_id = auth.uid()
     and read_at is null;
end;
$$;

-- ============================================================================
-- Grants
-- ============================================================================

-- is_blocked is referenced by RLS policies, so authenticated must be able to call it.
grant usage on schema app to authenticated;
grant execute on function app.is_blocked(uuid, uuid) to authenticated;

-- RPCs are the authenticated API surface only — anon is explicitly excluded.
revoke all on function public.update_my_location(double precision, double precision) from public, anon;
grant execute on function public.update_my_location(double precision, double precision) to authenticated;

revoke all on function public.nearby_profiles(integer, double precision) from public, anon;
grant execute on function public.nearby_profiles(integer, double precision) to authenticated;

revoke all on function public.mark_messages_read(uuid[]) from public, anon;
grant execute on function public.mark_messages_read(uuid[]) to authenticated;

-- ============================================================================
-- Realtime
-- ============================================================================

alter publication supabase_realtime add table public.messages;
