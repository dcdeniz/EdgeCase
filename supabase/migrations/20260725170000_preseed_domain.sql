alter table public.profiles
  add column fertility_track text not null default 'general'
    check (fertility_track in ('general', 'vasectomy_reversal', 'pre_treatment_preservation')),
  add column onboarding_data jsonb not null default '{}'::jsonb
    check (jsonb_typeof(onboarding_data) = 'object'),
  add column onboarding_completed_at timestamptz,
  add column health_data_consented_at timestamptz;

create table public.clinical_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test_type text not null check (test_type in ('semen_analysis', 'hormone_panel')),
  source text not null check (source in ('manual', 'upload', 'simulated')),
  collected_at timestamptz not null,
  lab_name text check (lab_name is null or char_length(lab_name) <= 200),
  abstinence_hours integer check (abstinence_hours is null or abstinence_hours between 0 and 720),
  collection_complete boolean,
  recent_fever boolean not null default false,
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create index clinical_tests_user_collected_idx on public.clinical_tests (user_id, collected_at desc, id desc);

create table public.clinical_markers (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null check (code in (
    'volume_ml', 'concentration_million_ml', 'total_count_million',
    'progressive_motility_pct', 'total_motility_pct', 'normal_morphology_pct',
    'dna_fragmentation_pct', 'fsh_iu_l', 'lh_iu_l', 'total_testosterone_nmol_l',
    'free_testosterone_nmol_l', 'estradiol_pmol_l', 'prolactin_miu_l',
    'shbg_nmol_l', 'tsh_miu_l'
  )),
  numeric_value numeric not null,
  unit text not null check (char_length(unit) between 1 and 40),
  reference_low numeric,
  reference_high numeric,
  verification text not null default 'user_entered'
    check (verification in ('user_entered', 'user_confirmed', 'lab_report')),
  created_at timestamptz not null default now(),
  unique (test_id, code),
  foreign key (test_id, user_id) references public.clinical_tests(id, user_id) on delete cascade
);
create index clinical_markers_user_test_idx on public.clinical_markers (user_id, test_id);

create table public.protocols (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  version integer not null check (version > 0),
  status text not null default 'active' check (status in ('draft', 'active', 'completed', 'superseded')),
  starts_on date not null,
  ends_on date not null check (ends_on >= starts_on),
  title text not null check (char_length(title) between 1 and 200),
  rationale text not null default '' check (char_length(rationale) <= 4000),
  created_at timestamptz not null default now(),
  unique (user_id, version),
  unique (id, user_id)
);
create unique index protocols_one_active_per_user on public.protocols (user_id) where status = 'active';

create table public.protocol_items (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  week_number integer not null check (week_number between 1 and 104),
  category text not null check (category in ('nutrition', 'exercise', 'sleep', 'supplement', 'exposure', 'lifestyle', 'clinical_navigation')),
  title text not null check (char_length(title) between 1 and 200),
  description text not null check (char_length(description) between 1 and 2000),
  evidence_status text not null check (evidence_status in ('evidence_backed', 'general_guidance')),
  evidence_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (protocol_id, user_id) references public.protocols(id, user_id) on delete cascade
);
create index protocol_items_protocol_week_idx on public.protocol_items (protocol_id, week_number, id);

create table public.adherence_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  protocol_item_id uuid not null,
  occurred_on date not null,
  status text not null check (status in ('completed', 'partial', 'skipped')),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  unique (user_id, protocol_item_id, occurred_on),
  foreign key (protocol_item_id, user_id) references public.protocol_items(id, user_id) on delete cascade
);
create index adherence_events_user_date_idx on public.adherence_events (user_id, occurred_on desc);

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  protocol_id uuid,
  adherence_rating integer check (adherence_rating between 1 and 5),
  wellbeing_rating integer check (wellbeing_rating between 1 and 5),
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  foreign key (protocol_id, user_id) references public.protocols(id, user_id) on delete set null (protocol_id)
);
create index check_ins_user_created_idx on public.check_ins (user_id, created_at desc);

create function public.enforce_current_user_id()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.user_id is distinct from (select auth.uid()) then raise exception 'user_id must match authenticated user'; end if;
  return new;
end;
$$;

create trigger clinical_tests_user_guard before insert or update on public.clinical_tests for each row execute function public.enforce_current_user_id();
create trigger clinical_markers_user_guard before insert or update on public.clinical_markers for each row execute function public.enforce_current_user_id();
create trigger protocols_user_guard before insert or update on public.protocols for each row execute function public.enforce_current_user_id();
create trigger protocol_items_user_guard before insert or update on public.protocol_items for each row execute function public.enforce_current_user_id();
create trigger adherence_events_user_guard before insert or update on public.adherence_events for each row execute function public.enforce_current_user_id();
create trigger check_ins_user_guard before insert or update on public.check_ins for each row execute function public.enforce_current_user_id();

alter table public.clinical_tests enable row level security;
alter table public.clinical_markers enable row level security;
alter table public.protocols enable row level security;
alter table public.protocol_items enable row level security;
alter table public.adherence_events enable row level security;
alter table public.check_ins enable row level security;

create policy clinical_tests_own on public.clinical_tests for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy clinical_markers_own on public.clinical_markers for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy protocols_select_own on public.protocols for select to authenticated using ((select auth.uid()) = user_id);
create policy protocols_insert_own on public.protocols for insert to authenticated with check ((select auth.uid()) = user_id);
create policy protocol_items_select_own on public.protocol_items for select to authenticated using ((select auth.uid()) = user_id);
create policy protocol_items_insert_own on public.protocol_items for insert to authenticated with check ((select auth.uid()) = user_id);
create policy adherence_events_own on public.adherence_events for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy check_ins_own on public.check_ins for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create function public.create_protocol_with_items(
  p_starts_on date,
  p_ends_on date,
  p_title text,
  p_rationale text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_protocol_id uuid;
  v_version integer;
  v_item jsonb;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  if p_ends_on < p_starts_on then raise exception 'ends_on must not precede starts_on'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'at least one protocol item is required'; end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  update public.protocols set status = 'superseded' where user_id = v_user_id and status = 'active';
  select coalesce(max(version), 0) + 1 into v_version from public.protocols where user_id = v_user_id;

  insert into public.protocols (user_id, version, status, starts_on, ends_on, title, rationale)
  values (v_user_id, v_version, 'active', p_starts_on, p_ends_on, p_title, coalesce(p_rationale, ''))
  returning id into v_protocol_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    insert into public.protocol_items (protocol_id, user_id, week_number, category, title, description, evidence_status, evidence_ids)
    values (
      v_protocol_id, v_user_id, (v_item ->> 'week_number')::integer,
      v_item ->> 'category', v_item ->> 'title', v_item ->> 'description',
      v_item ->> 'evidence_status',
      coalesce(array(select jsonb_array_elements_text(v_item -> 'evidence_ids')), '{}'::text[])
    );
  end loop;
  return v_protocol_id;
end;
$$;

grant select, insert, update, delete on public.clinical_tests, public.clinical_markers, public.adherence_events, public.check_ins to authenticated;
grant select, insert on public.protocols, public.protocol_items to authenticated;
revoke all on function public.create_protocol_with_items(date, date, text, text, jsonb) from public, anon;
grant execute on function public.create_protocol_with_items(date, date, text, text, jsonb) to authenticated;
