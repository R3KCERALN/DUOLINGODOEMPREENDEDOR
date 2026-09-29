create or replace function public.journal_date_immutable() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.date is distinct from old.date then
    raise exception 'journal_date_immutable' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger journal_date_immutable before update on public.journal_entries
for each row execute function public.journal_date_immutable();
