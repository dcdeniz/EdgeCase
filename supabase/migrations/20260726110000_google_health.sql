create table public.wearable_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null check (provider = 'google_health'),
  provider_user_id text not null check (char_length(provider_user_id) between 1 and 200),
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  scopes text[] not null default '{}',
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wearable_daily_summaries (
  user_id uuid not null references auth.users(id) on delete cascade,
  observed_on date not null,
  source text not null check (source = 'google_health'),
  steps integer check (steps is null or steps >= 0),
  active_minutes integer check (active_minutes is null or active_minutes >= 0),
  resting_heart_rate integer check (resting_heart_rate is null or resting_heart_rate between 20 and 250),
  sleep_minutes integer check (sleep_minutes is null or sleep_minutes between 0 and 1440),
  sleep_stages jsonb not null default '{}'::jsonb check (jsonb_typeof(sleep_stages) = 'object'),
  synced_at timestamptz not null default now(),
  primary key (user_id, observed_on, source)
);

create index wearable_daily_summaries_user_date_idx
  on public.wearable_daily_summaries (user_id, observed_on desc);

alter table public.wearable_connections enable row level security;
alter table public.wearable_daily_summaries enable row level security;

create policy wearable_daily_summaries_select_own
  on public.wearable_daily_summaries for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.wearable_connections from public, anon, authenticated;
revoke all on public.wearable_daily_summaries from public, anon;
grant select on public.wearable_daily_summaries to authenticated;
