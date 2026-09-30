alter table public.simulations
  add constraint simulations_phase_ck check (phase in ('f1', 'f2', 'f3', 'f4'));
alter table public.simulation_recordings
  add constraint recording_path_ck check (file_path like simulation_id::text || '/%');

-- Ciclo de vida do simulado (RF-83) e revelação do cenário (RF-75)
create or replace function public.simulation_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.mode is distinct from old.mode or new.difficulty is distinct from old.difficulty
     or new.phase is distinct from old.phase or new.is_boss is distinct from old.is_boss
     or new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at then
    raise exception 'simulation_immutable' using errcode = 'P0001';
  end if;
  if new.status is distinct from old.status then
    if not ((old.status = 'sorteado' and new.status = 'em_andamento')
         or (old.status = 'em_andamento' and new.status = 'aguardando_notas')
         or (old.status = 'aguardando_notas' and new.status = 'concluido' and public.both_scored(old.id))) then
      raise exception 'invalid_status_transition' using errcode = 'P0001';
    end if;
    if new.status = 'em_andamento' then new.started_at := now(); end if;
    if new.status = 'aguardando_notas' then new.revealed_at := coalesce(new.revealed_at, old.revealed_at, now()); end if;
  end if;
  return new;
end $$;

create trigger simulation_guard before update on public.simulations
for each row execute function public.simulation_guard();

-- Ficha só depois que o simulado terminou
create or replace function public.score_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare st public.sim_status;
begin
  select status into st from public.simulations where id = new.simulation_id;
  if st is distinct from 'aguardando_notas' then
    raise exception 'simulation_not_finished' using errcode = 'P0001';
  end if;
  new.submitted_at := now();
  return new;
end $$;

create trigger score_guard before insert on public.simulation_scores
for each row execute function public.score_guard();

-- Duas fichas => concluído; nota do mentor => começa a contar os 30 dias do áudio (RF-76j)
create or replace function public.score_after() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if public.both_scored(new.simulation_id) then
    update public.simulations set status = 'concluido' where id = new.simulation_id and status = 'aguardando_notas';
  end if;
  if exists (select 1 from public.profiles p where p.id = new.rater_id and p.role = 'mentor') then
    update public.simulation_recordings set delete_after = now() + interval '30 days'
    where simulation_id = new.simulation_id and not keep;
  end if;
  return new;
end $$;

create trigger score_after after insert on public.simulation_scores
for each row execute function public.score_after();

-- Gravação: campos fixos; retenção calculada no banco
create or replace function public.recording_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare mentor_scored boolean;
begin
  select exists (
    select 1 from public.simulation_scores s join public.profiles p on p.id = s.rater_id
    where s.simulation_id = new.simulation_id and p.role = 'mentor') into mentor_scored;
  if tg_op = 'UPDATE' then
    if new.simulation_id is distinct from old.simulation_id or new.file_path is distinct from old.file_path
       or new.mime is distinct from old.mime or new.duration_sec is distinct from old.duration_sec
       or new.size_bytes is distinct from old.size_bytes then
      raise exception 'recording_immutable' using errcode = 'P0001';
    end if;
    -- derivado do estado: guardada ou sem nota do mentor => nunca expira; senão 30 dias após a nota
    new.delete_after := case
      when new.keep or not mentor_scored then null
      else coalesce(old.delete_after, now() + interval '30 days') end;
  else
    new.keep := false;
    new.delete_after := case when mentor_scored then now() + interval '30 days' end;
  end if;
  return new;
end $$;

create trigger recording_guard before insert or update on public.simulation_recordings
for each row execute function public.recording_guard();

-- Criação atômica (security invoker: o RLS de simulations, scenarios e cards continua valendo)
create or replace function public.create_simulation(
  p_mode public.sim_mode, p_difficulty public.difficulty, p_phase text, p_is_boss boolean,
  p_objective text, p_profile text, p_product text, p_complications text[], p_cards jsonb default '[]'
) returns uuid
language plpgsql set search_path = '' as $$
declare sim uuid;
begin
  insert into public.simulations (mode, difficulty, phase, is_boss)
  values (p_mode, p_difficulty, p_phase, p_is_boss) returning id into sim;
  insert into public.simulation_scenarios (simulation_id, objective_id, profile_id, product_id, complication_ids)
  values (sim, p_objective, p_profile, p_product, coalesce(p_complications, '{}'));
  insert into public.simulation_cards (simulation_id, position, kind, ref_id)
  select sim, (c->>'position')::smallint, (c->>'kind')::public.card_kind, c->>'ref_id'
  from jsonb_array_elements(p_cards) c;
  return sim;
end $$;

-- Áudio só na pasta do próprio treino da aluna (RF-76g, PRD §7.1)
drop policy rec_write on storage.objects;
create policy rec_write on storage.objects for insert to authenticated with check (
  bucket_id = 'recordings' and public.my_role() = 'aluna' and exists (
    select 1 from public.simulations s
    where s.id::text = (storage.foldername(name))[1] and s.created_by = auth.uid() and s.mode = 'treino'));
update storage.buckets set allowed_mime_types = array['audio/*'] where id = 'recordings';

-- Resultado oficial por simulado, para os itens automáticos de portão (RF-40)
create view public.v_simulation_results with (security_invoker = true) as
select s.id as simulation_id, s.mode, s.difficulty, s.phase, s.is_boss, s.created_at,
       sc.objective_id, o.total_official
from public.simulations s
join public.v_simulation_official o on o.simulation_id = s.id
left join public.simulation_scenarios sc on sc.simulation_id = s.id;
