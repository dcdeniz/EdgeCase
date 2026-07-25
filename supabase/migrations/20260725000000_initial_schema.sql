create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 100),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 2048),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notes_user_updated_idx on public.notes (user_id, updated_at desc);

create function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at = pg_catalog.now(); return new; end; $$;
create trigger notes_set_updated_at before update on public.notes for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    nullif(left(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 100), ''),
    nullif(left(trim(coalesce(new.raw_user_meta_data ->> 'avatar_url', '')), 2048), '')
  );
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.notes enable row level security;
create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy notes_select_own on public.notes for select to authenticated using ((select auth.uid()) = user_id);
create policy notes_insert_own on public.notes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy notes_update_own on public.notes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy notes_delete_own on public.notes for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.profiles from anon;
revoke all on public.notes from anon;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.notes to authenticated;
