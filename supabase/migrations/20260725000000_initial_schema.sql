create extension if not exists pgcrypto;
create table public.notes (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200), body text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index notes_user_updated_idx on public.notes (user_id, updated_at desc);
create function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = pg_catalog.now(); return new; end; $$;
create trigger notes_set_updated_at before update on public.notes for each row execute function public.set_updated_at();
alter table public.notes enable row level security;
create policy notes_select_own on public.notes for select to authenticated using ((select auth.uid()) = user_id);
create policy notes_insert_own on public.notes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy notes_update_own on public.notes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy notes_delete_own on public.notes for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.notes from anon;
grant select, insert, update, delete on public.notes to authenticated;
