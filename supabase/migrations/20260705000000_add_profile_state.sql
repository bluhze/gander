alter table public.profiles
  add column if not exists state text
  check (state is null or state ~ '^[A-Z]{2}$');

comment on column public.profiles.state is 'US state code (e.g. NY, CA)';
