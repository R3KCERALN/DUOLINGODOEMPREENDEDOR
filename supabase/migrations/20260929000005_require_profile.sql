-- Leitura só para contas com perfil (aluna/mentor); conta autenticada sem perfil não lê nada.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'item_progress', 'node_overrides', 'checklists', 'checklist_items', 'books',
    'book_progress', 'reel_items', 'challenge_cards', 'simulations', 'simulation_cards',
    'simulation_recordings', 'journal_entries'
  ] loop
    execute format('drop policy read_all on public.%I', t);
    execute format('create policy read_all on public.%I for select to authenticated using (public.my_role() is not null)', t);
  end loop;
end $$;

drop policy books_read on storage.objects;
create policy books_read on storage.objects for select to authenticated
  using (bucket_id = 'books' and public.my_role() is not null);
drop policy rec_read on storage.objects;
create policy rec_read on storage.objects for select to authenticated
  using (bucket_id = 'recordings' and public.my_role() is not null);
