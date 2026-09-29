create or replace function public.journal_window(entry date, at timestamptz) returns text
language sql immutable set search_path = '' as $$
  select case
    when entry = (at at time zone 'America/Sao_Paulo')::date then 'on_time'
    when entry = (at at time zone 'America/Sao_Paulo')::date - 1
         and extract(hour from at at time zone 'America/Sao_Paulo') < 12 then 'late'
    else 'closed'
  end
$$;

create or replace function public.journal_guard() returns trigger
language plpgsql set search_path = '' as $$
declare w text := public.journal_window(new.date, now());
begin
  if w = 'closed' then
    raise exception 'journal_closed' using errcode = 'P0001';
  end if;
  new.complete := char_length(btrim(new.learned)) >= 15
              and char_length(btrim(new.practiced)) >= 15
              and char_length(btrim(new.tomorrow)) >= 15;
  if tg_op = 'UPDATE' and old.complete and not old.late then
    new.late := false;              -- já foi concluído no prazo; editar depois não vira atraso
  else
    new.late := new.complete and w = 'late';
  end if;
  new.updated_at := now();
  new.created_at := case when tg_op = 'INSERT' then now() else old.created_at end;
  new.user_id := case when tg_op = 'INSERT' then auth.uid() else old.user_id end;
  return new;
end $$;

create trigger journal_guard before insert or update on public.journal_entries
for each row execute function public.journal_guard();
