-- A ficha também é guardada no UPDATE: sem isso, trocar simulation_id levava a ficha
-- para um simulado ainda em andamento (ou já com a ficha do mentor) sem passar pelo score_guard.
create or replace function public.score_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare st public.sim_status;
begin
  if tg_op = 'UPDATE' and (new.simulation_id is distinct from old.simulation_id or new.rater_id is distinct from old.rater_id) then
    raise exception 'score_immutable' using errcode = 'P0001';
  end if;
  select status into st from public.simulations where id = new.simulation_id;
  if st is distinct from 'aguardando_notas' then
    raise exception 'simulation_not_finished' using errcode = 'P0001';
  end if;
  new.submitted_at := now();
  return new;
end $$;

drop trigger score_guard on public.simulation_scores;
create trigger score_guard before insert or update on public.simulation_scores
for each row execute function public.score_guard();
