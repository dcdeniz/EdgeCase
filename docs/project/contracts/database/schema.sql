-- Review snapshot; executable source is supabase/migrations/20260725000000_initial_schema.sql.
create table public.notes (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200), body text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.notes enable row level security;
