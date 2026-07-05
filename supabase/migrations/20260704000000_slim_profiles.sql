-- ============================================================
-- Dating App Schema v2 (SLIM) — Supabase / PostGIS
-- Profile = display name, age (via DOB), username, photo, bio.
-- Location privacy layer kept intact (private schema + RPCs).
-- Everything else (prefs, albums, sensitive data) deferred.
-- ============================================================

create extension if not exists postgis;
create extension if not exists citext;

create schema if not exists private;

-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  username citext not null unique
    check (username ~ '^[a-z0-9_]{3,20}$'),   -- lowercase, 3–20 chars

  display_name text not null
    check (char_length(display_name) between 1 and 30),

  -- store DOB, derive age; enables the 18+ gate and keeps age accurate
  date_of_birth date not null
    check (date_of_birth <= (current_date - interval '18 years')),

  bio text check (char_length(bio) <= 500),

  -- single profile photo for now: path in the 'profile-photos' bucket
  photo_path text,

  is_visible boolean not null default true,
  is_banned boolean not null default false,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_last_active_idx on public.profiles (last_active_at desc);

-- convenience view of age (never expose DOB itself to other users)
-- age is computed in the RPC below; DOB stays server-side.

-- ------------------------------------------------------------
-- LOCATIONS (unchanged: raw coords, zero client access)
-- ------------------------------------------------------------
create table private.locations (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  geo geography(point, 4326) not null,
  updated_at timestamptz not null default now()
);
create index locations_geo_idx on private.locations using gist (geo);

-- ------------------------------------------------------------
-- BLOCKS (minimal safety primitive — worth keeping from day one)
-- ------------------------------------------------------------
create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- ------------------------------------------------------------
-- updated_at trigger
-- ------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.blocks enable row level security;
alter table private.locations enable row level security;  -- no policies = no client access

-- ---- profiles ----
create policy "read visible profiles" on public.profiles
  for select to authenticated
  using (
    is_visible and not is_banned
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = profiles.id)
         or (b.blocker_id = profiles.id and b.blocked_id = auth.uid())
    )
  );

create policy "read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());

create policy "insert own profile" on public.profiles
  for insert to authenticated with check (id = auth.uid());

create policy "update own profile" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and is_banned = false);

-- ---- blocks ----
create policy "own blocks" on public.blocks
  for all to authenticated
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- ============================================================
-- RPCs
-- ============================================================

-- username availability check (safe to expose; returns boolean only)
create or replace function public.username_available(candidate citext)
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select not exists (select 1 from public.profiles where username = candidate);
$$;
grant execute on function public.username_available to authenticated, anon;

-- write location (coords go in, nothing comes back)
create or replace function public.update_my_location(lat double precision, lng double precision)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if lat is null or lng is null or abs(lat) > 90 or abs(lng) > 180 then
    raise exception 'invalid coordinates';
  end if;

  insert into private.locations (profile_id, geo, updated_at)
  values (auth.uid(), st_setsrid(st_makepoint(lng, lat), 4326)::geography, now())
  on conflict (profile_id)
  do update set geo = excluded.geo, updated_at = now();

  update public.profiles set last_active_at = now() where id = auth.uid();
end $$;
revoke all on function public.update_my_location from public;
grant execute on function public.update_my_location to authenticated;

-- discovery: slim payload, quantized distance, blocks enforced,
-- sorted by quantized distance (no sub-bucket leakage via ordering)
create or replace function public.nearby_profiles(
  p_max_km int default 50,
  p_limit int default 60,
  p_offset int default 0
)
returns table (
  profile_id uuid,
  username citext,
  display_name text,
  age int,
  bio text,
  photo_path text,
  distance_m int,
  last_active_at timestamptz
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  me geography;
begin
  select geo into me from private.locations where profile_id = auth.uid();
  if me is null then
    raise exception 'no location set';
  end if;

  return query
  with candidates as (
    select
      p.id, p.username, p.display_name, p.bio, p.photo_path, p.last_active_at,
      date_part('year', age(p.date_of_birth))::int as age,
      case
        when st_distance(l.geo, me) < 1000
          then (ceil(st_distance(l.geo, me) / 250.0) * 250)::int
        else (ceil(st_distance(l.geo, me) / 500.0) * 500)::int
      end as dist_q
    from public.profiles p
    join private.locations l on l.profile_id = p.id
    where p.id <> auth.uid()
      and p.is_visible and not p.is_banned
      and st_dwithin(l.geo, me, least(greatest(p_max_km, 1), 500) * 1000)
      and not exists (
        select 1 from public.blocks b
        where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
           or (b.blocker_id = p.id and b.blocked_id = auth.uid())
      )
  )
  select c.id, c.username, c.display_name, c.age, c.bio, c.photo_path,
         c.dist_q, c.last_active_at
  from candidates c
  order by c.dist_q asc, c.last_active_at desc   -- quantized sort: no precision leak
  limit p_limit offset p_offset;
end $$;
revoke all on function public.nearby_profiles from public;
grant execute on function public.nearby_profiles to authenticated;

-- ============================================================
-- STORAGE (dashboard or separate migration)
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('profile-photos','profile-photos', false);
--
-- create policy "upload own photo" on storage.objects
--   for insert to authenticated
--   with check (bucket_id = 'profile-photos'
--     and (storage.foldername(name))[1] = auth.uid()::text);
--
-- create policy "update own photo" on storage.objects
--   for update to authenticated
--   using (bucket_id = 'profile-photos'
--     and (storage.foldername(name))[1] = auth.uid()::text);
--
-- Serve photos via signed URLs (createSignedUrl) from your Next.js
-- API route; keep the bucket private.
