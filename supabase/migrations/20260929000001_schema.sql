create extension if not exists pgtap with schema extensions;

create type public.app_role as enum ('aluna', 'mentor');
create type public.sim_mode as enum ('surpresa', 'treino');
create type public.sim_status as enum ('sorteado', 'em_andamento', 'aguardando_notas', 'concluido');
create type public.difficulty as enum ('facil', 'medio', 'dificil');
create type public.card_kind as enum ('complicacao', 'questionamento');

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role public.app_role not null,
  name text not null
);
create unique index profiles_one_per_role on public.profiles (role);

create or replace function public.my_role() returns public.app_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;

create table public.item_progress (
  item_id text primary key,
  done_at timestamptz not null default now(),
  done_by uuid not null references public.profiles default auth.uid()
);

create table public.node_overrides (
  node_id text primary key,
  state text not null check (state in ('unlocked', 'locked')),
  by uuid not null references public.profiles default auth.uid(),
  at timestamptz not null default now()
);

create table public.checklists (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles default auth.uid(),
  title text not null check (char_length(title) between 1 and 120),
  week_id text,
  due_date date,
  created_at timestamptz not null default now()
);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.checklists on delete cascade,
  text text not null check (char_length(text) between 1 and 300),
  done_at timestamptz,
  position int not null default 0
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles default auth.uid(),
  date date not null,
  learned text not null default '',
  practiced text not null default '',
  tomorrow text not null default '',
  complete boolean not null default false,
  late boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  author uuid not null references public.profiles default auth.uid(),
  title text not null default '',
  body text not null default '',
  private boolean not null default true,
  link_type text check (link_type in ('week', 'video', 'book', 'simulation')),
  link_id text,
  updated_at timestamptz not null default now(),
  search tsvector generated always as (to_tsvector('portuguese', title || ' ' || body)) stored
);
create index notes_search_idx on public.notes using gin (search);

create table public.books (
  id text primary key,
  "order" int not null,
  title text not null,
  author text,
  phase text not null,
  kind text not null check (kind in ('livro', 'curso')),
  file_path text,
  external_url text
);

create table public.book_progress (
  book_id text primary key references public.books on delete cascade,
  page int not null check (page >= 1),
  total_pages int check (total_pages >= 1),
  updated_at timestamptz not null default now()
);

create table public.reel_items (
  id text primary key,
  reel smallint not null check (reel between 1 and 4),
  label text not null,
  mentor_role text,
  student_goal text,
  client_line text,
  is_none boolean not null default false,
  original boolean not null default false,
  active boolean not null default true
);

create table public.challenge_cards (
  id text primary key,
  text text not null,
  active boolean not null default true
);

create table public.simulations (
  id uuid primary key default gen_random_uuid(),
  mode public.sim_mode not null,
  difficulty public.difficulty not null,
  phase text not null,
  status public.sim_status not null default 'sorteado',
  is_boss boolean not null default false,
  created_by uuid not null references public.profiles default auth.uid(),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  revealed_at timestamptz
);

create table public.simulation_scenarios (
  simulation_id uuid primary key references public.simulations on delete cascade,
  objective_id text not null references public.reel_items,
  profile_id text not null references public.reel_items,
  product_id text not null references public.reel_items,
  complication_ids text[] not null default '{}'
);

create table public.simulation_scores (
  simulation_id uuid not null references public.simulations on delete cascade,
  rater_id uuid not null references public.profiles default auth.uid(),
  abertura smallint not null check (abertura between 1 and 5),
  tom smallint not null check (tom between 1 and 5),
  perguntas smallint not null check (perguntas between 1 and 5),
  escuta smallint not null check (escuta between 1 and 5),
  objecao smallint not null check (objecao between 1 and 5),
  fechamento smallint not null check (fechamento between 1 and 5),
  good text not null default '',
  improve text not null default '',
  submitted_at timestamptz not null default now(),
  primary key (simulation_id, rater_id)
);

create table public.simulation_cards (
  simulation_id uuid not null references public.simulations on delete cascade,
  position smallint not null,
  kind public.card_kind not null,
  ref_id text not null,
  shown_at_sec int check (shown_at_sec >= 0),
  primary key (simulation_id, position)
);

create table public.simulation_recordings (
  simulation_id uuid primary key references public.simulations on delete cascade,
  file_path text not null,
  mime text not null,
  duration_sec int not null check (duration_sec between 0 and 720),
  size_bytes bigint not null,
  keep boolean not null default false,
  delete_after timestamptz
);

create or replace function public.both_scored(sim uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select count(*) = 2 from public.simulation_scores where simulation_id = sim
$$;

create view public.v_simulation_official with (security_invoker = true) as
select
  simulation_id,
  round(avg(abertura)::numeric, 1)   as abertura,
  round(avg(tom)::numeric, 1)        as tom,
  round(avg(perguntas)::numeric, 1)  as perguntas,
  round(avg(escuta)::numeric, 1)     as escuta,
  round(avg(objecao)::numeric, 1)    as objecao,
  round(avg(fechamento)::numeric, 1) as fechamento,
  round(avg(abertura + tom + perguntas + escuta + objecao + fechamento)::numeric, 1) as total_official
from public.simulation_scores
group by simulation_id
having count(*) = 2;
