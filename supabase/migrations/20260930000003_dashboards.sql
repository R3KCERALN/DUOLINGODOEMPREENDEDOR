-- Painéis (E7). Datas sempre em America/Sao_Paulo; a semana começa na segunda.

-- Um simulado com as duas fichas por linha: total de cada pessoa (RF-92) e médias oficiais (RF-91, RF-93).
-- security_invoker: o RLS das fichas vale, então ninguém enxerga a ficha do outro antes de as duas existirem (RF-80).
create view public.v_score_series with (security_invoker = true) as
select s.id as simulation_id, s.mode, s.difficulty, s.phase, s.is_boss,
       timezone('America/Sao_Paulo', s.created_at)::date as day,
       date_trunc('week', timezone('America/Sao_Paulo', s.created_at))::date as week_start,
       t.student_total, t.mentor_total,
       o.abertura, o.tom, o.perguntas, o.escuta, o.objecao, o.fechamento, o.total_official
from public.simulations s
join public.v_simulation_official o on o.simulation_id = s.id
join (
  select sc.simulation_id,
         max(sc.abertura + sc.tom + sc.perguntas + sc.escuta + sc.objecao + sc.fechamento) filter (where p.role = 'aluna')::int  as student_total,
         max(sc.abertura + sc.tom + sc.perguntas + sc.escuta + sc.objecao + sc.fechamento) filter (where p.role = 'mentor')::int as mentor_total
  from public.simulation_scores sc
  join public.profiles p on p.id = sc.rater_id
  group by sc.simulation_id
) t on t.simulation_id = s.id;

-- Atividade por dia (RF-94/99a): item marcado pela aluna, simulado criado ou caderno completo.
create view public.v_activity_days with (security_invoker = true) as
select day, sum(items)::int as items, sum(simulations)::int as simulations, bool_or(journal) as journal
from (
  select timezone('America/Sao_Paulo', ip.done_at)::date as day, 1 as items, 0 as simulations, false as journal
  from public.item_progress ip
  join public.profiles p on p.id = ip.done_by and p.role = 'aluna'
  union all
  select je.date, 0, 0, true from public.journal_entries je where je.complete
  union all
  select timezone('America/Sao_Paulo', s.created_at)::date, 0, 1, false from public.simulations s
) a
group by day;

-- Uso do Storage (RNF-11): só o mentor. security definer porque as políticas de storage.objects não somam tudo.
create or replace function public.storage_usage() returns table (bucket text, bytes bigint, files integer)
language plpgsql stable security definer set search_path = '' as $$
begin
  if public.my_role() is distinct from 'mentor' then
    raise exception 'mentor_only' using errcode = '42501';
  end if;
  return query
    select o.bucket_id::text, coalesce(sum((o.metadata ->> 'size')::bigint), 0)::bigint, count(*)::integer
    from storage.objects o
    where o.bucket_id in ('books', 'recordings')
    group by o.bucket_id;
end $$;

revoke all on public.v_score_series, public.v_activity_days from anon;
revoke all on function public.storage_usage() from public, anon;
grant execute on function public.storage_usage() to authenticated;
