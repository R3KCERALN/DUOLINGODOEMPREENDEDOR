alter table public.profiles              enable row level security;
alter table public.item_progress         enable row level security;
alter table public.node_overrides        enable row level security;
alter table public.checklists            enable row level security;
alter table public.checklist_items       enable row level security;
alter table public.journal_entries       enable row level security;
alter table public.notes                 enable row level security;
alter table public.books                 enable row level security;
alter table public.book_progress         enable row level security;
alter table public.reel_items            enable row level security;
alter table public.challenge_cards       enable row level security;
alter table public.simulations           enable row level security;
alter table public.simulation_scenarios  enable row level security;
alter table public.simulation_scores     enable row level security;
alter table public.simulation_cards      enable row level security;
alter table public.simulation_recordings enable row level security;

-- leitura comum às duas contas
create policy read_all on public.profiles        for select to authenticated using (true);
create policy read_all on public.item_progress   for select to authenticated using (true);
create policy read_all on public.node_overrides  for select to authenticated using (true);
create policy read_all on public.checklists      for select to authenticated using (true);
create policy read_all on public.checklist_items for select to authenticated using (true);
create policy read_all on public.books           for select to authenticated using (true);
create policy read_all on public.book_progress   for select to authenticated using (true);
create policy read_all on public.reel_items      for select to authenticated using (true);
create policy read_all on public.challenge_cards for select to authenticated using (true);
create policy read_all on public.simulations     for select to authenticated using (true);
create policy read_all on public.simulation_cards      for select to authenticated using (true);
create policy read_all on public.simulation_recordings for select to authenticated using (true);
create policy read_all on public.journal_entries for select to authenticated using (true);

-- progresso: as duas contas marcam; só mentor desmarca itens que não marcou (RF-41)
create policy write_own on public.item_progress for insert to authenticated with check (done_by = auth.uid());
create policy delete_item on public.item_progress for delete to authenticated
  using (done_by = auth.uid() or public.my_role() = 'mentor');

-- escrita só do mentor
create policy mentor_write on public.node_overrides  for all to authenticated using (public.my_role() = 'mentor') with check (public.my_role() = 'mentor');
create policy mentor_write on public.books           for all to authenticated using (public.my_role() = 'mentor') with check (public.my_role() = 'mentor');
create policy mentor_write on public.reel_items      for all to authenticated using (public.my_role() = 'mentor') with check (public.my_role() = 'mentor');
create policy mentor_write on public.challenge_cards for all to authenticated using (public.my_role() = 'mentor') with check (public.my_role() = 'mentor');

-- checklists manuais: dono edita
create policy owner_write on public.checklists for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
create policy owner_write on public.checklist_items for all to authenticated
  using (exists (select 1 from public.checklists c where c.id = checklist_id and c.owner = auth.uid()))
  with check (exists (select 1 from public.checklists c where c.id = checklist_id and c.owner = auth.uid()));

-- progresso de leitura: aluna escreve
create policy aluna_write on public.book_progress for all to authenticated using (public.my_role() = 'aluna') with check (public.my_role() = 'aluna');

-- caderno: aluna insere e atualiza; ninguém apaga (RF-50/52)
create policy aluna_insert on public.journal_entries for insert to authenticated with check (public.my_role() = 'aluna');
create policy aluna_update on public.journal_entries for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- notas livres: autora faz tudo; mentor lê não privadas (RF-52)
create policy author_all on public.notes for all to authenticated using (author = auth.uid()) with check (author = auth.uid());
create policy mentor_read_public on public.notes for select to authenticated using (public.my_role() = 'mentor' and not private);

-- simulações
create policy create_sim on public.simulations for insert to authenticated with check (
  created_by = auth.uid() and (
    (mode = 'surpresa' and public.my_role() = 'mentor') or
    (mode = 'treino'   and public.my_role() = 'aluna')));
create policy update_sim on public.simulations for update to authenticated
  using (created_by = auth.uid() or public.my_role() = 'mentor');

-- cenário: escondido da aluna no modo surpresa até a revelação (RF-75)
create policy scen_mentor on public.simulation_scenarios for select to authenticated using (public.my_role() = 'mentor');
create policy scen_aluna on public.simulation_scenarios for select to authenticated using (
  public.my_role() = 'aluna' and exists (
    select 1 from public.simulations s
    where s.id = simulation_id and (s.mode = 'treino' or s.revealed_at is not null)));
create policy scen_insert on public.simulation_scenarios for insert to authenticated with check (
  exists (select 1 from public.simulations s where s.id = simulation_id and s.created_by = auth.uid()));

create policy cards_insert on public.simulation_cards for insert to authenticated with check (
  exists (select 1 from public.simulations s where s.id = simulation_id and s.created_by = auth.uid()));
create policy cards_update on public.simulation_cards for update to authenticated using (
  exists (select 1 from public.simulations s where s.id = simulation_id and s.created_by = auth.uid()));

create policy rec_insert on public.simulation_recordings for insert to authenticated with check (
  public.my_role() = 'aluna' and exists (select 1 from public.simulations s where s.id = simulation_id and s.created_by = auth.uid()));
create policy rec_mentor on public.simulation_recordings for update to authenticated using (public.my_role() = 'mentor');
create policy rec_delete on public.simulation_recordings for delete to authenticated using (public.my_role() = 'mentor');

-- fichas: cada um a sua; a do outro só depois das duas (RF-80)
create policy score_insert on public.simulation_scores for insert to authenticated with check (rater_id = auth.uid());
create policy score_update on public.simulation_scores for update to authenticated
  using (rater_id = auth.uid() and not public.both_scored(simulation_id));
create policy score_read on public.simulation_scores for select to authenticated
  using (rater_id = auth.uid() or public.both_scored(simulation_id));

-- storage
insert into storage.buckets (id, name, public, file_size_limit)
values ('books', 'books', false, 52428800), ('recordings', 'recordings', false, 26214400);

create policy books_read   on storage.objects for select to authenticated using (bucket_id = 'books');
create policy books_write  on storage.objects for insert to authenticated with check (bucket_id = 'books' and public.my_role() = 'mentor');
create policy books_delete on storage.objects for delete to authenticated using (bucket_id = 'books' and public.my_role() = 'mentor');
create policy rec_read     on storage.objects for select to authenticated using (bucket_id = 'recordings');
create policy rec_write    on storage.objects for insert to authenticated with check (bucket_id = 'recordings' and public.my_role() = 'aluna');
create policy rec_remove   on storage.objects for delete to authenticated using (bucket_id = 'recordings' and public.my_role() = 'mentor');
