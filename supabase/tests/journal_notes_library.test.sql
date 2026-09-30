begin;
-- independente das contas locais: tudo é desfeito pelo rollback no fim
truncate public.profiles cascade;
delete from auth.users;
select plan(23);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'aluna@test'),
  ('00000000-0000-0000-0000-00000000000b', 'mentor@test');
insert into public.profiles values
  ('00000000-0000-0000-0000-00000000000a', 'aluna', 'Aluna'),
  ('00000000-0000-0000-0000-00000000000b', 'mentor', 'Mentor');

-- caderno: a aluna salva e regrava o mesmo dia (upsert) sem duplicar
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
insert into public.journal_entries (date, learned, practiced, tomorrow)
values (timezone('America/Sao_Paulo', now())::date, 'aprendi a ouvir', 'curto', '')
on conflict (user_id, date) do update set learned = excluded.learned, practiced = excluded.practiced, tomorrow = excluded.tomorrow;
insert into public.journal_entries (date, learned, practiced, tomorrow)
values (timezone('America/Sao_Paulo', now())::date, 'aprendi a ouvir o cliente', 'pratiquei o pitch de 30 s', 'amanhã ligo para 3 empresas')
on conflict (user_id, date) do update set learned = excluded.learned, practiced = excluded.practiced, tomorrow = excluded.tomorrow;
select is((select count(*)::int from public.journal_entries), 1, 'regravar o mesmo dia atualiza a mesma linha');
select is((select complete from public.journal_entries), true, 'três campos com 15+ caracteres completam a entrada');

-- mentor lê o caderno, mas não escreve nele (RF-50/52)
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select is((select count(*)::int from public.journal_entries), 1, 'mentor lê o caderno da aluna');
select throws_ok($$ insert into public.journal_entries (date, learned, practiced, tomorrow)
  values (timezone('America/Sao_Paulo', now())::date - 1, 'x', 'y', 'z') $$, '42501', null, 'mentor não escreve no caderno');

-- notas: privada por padrão e invisível ao mentor; compartilhada aparece (RF-52)
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
insert into public.notes (id, title, body) values ('aaaaaaaa-0000-0000-0000-000000000001', 'segredo', 'técnicas de vendas por telefone');
insert into public.notes (id, title, body, private) values ('aaaaaaaa-0000-0000-0000-000000000002', 'aberta', 'rotina de prospecção', false);
select is((select private from public.notes where title = 'segredo'), true, 'nota nasce privada');
select is((select count(*)::int from public.notes where search @@ websearch_to_tsquery('portuguese', 'vendas')), 1, 'busca em português acha a nota');
select lives_ok($$ update public.notes set updated_at = '2000-01-01' where title = 'segredo' $$, 'aluna edita a própria nota');
select isnt((select updated_at from public.notes where title = 'segredo'), '2000-01-01'::timestamptz, 'o banco decide o updated_at');
select throws_ok($$ insert into public.notes (title, body, link_type) values ('x', 'y', 'week') $$, '23514', null, 'vínculo precisa de tipo e id');
select throws_ok($$ insert into public.notes (title) values (repeat('x', 201)) $$, '23514', null, 'título com mais de 200 caracteres é recusado');

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select is((select array_agg(title order by title) from public.notes), array['aberta'], 'mentor vê só a nota compartilhada');
update public.notes set title = 'invadida' where id = 'aaaaaaaa-0000-0000-0000-000000000002';
select is((select title from public.notes where id = 'aaaaaaaa-0000-0000-0000-000000000002'), 'aberta', 'mentor não edita nota da aluna');

-- biblioteca: só o mentor altera livros e sobe PDFs; só a aluna salva a página (RF-61/63)
select lives_ok($$ update public.books set external_url = 'https://exemplo.com/audiolivro' where id = 'carnegie' $$, 'mentor grava o link externo');
select throws_ok($$ update public.books set external_url = 'javascript:alert(1)' where id = 'carnegie' $$, '23514', null, 'link externo só http(s)');
select throws_ok($$ update public.books set file_path = 'outro/arquivo.pdf' where id = 'carnegie' $$, '23514', null, 'arquivo precisa estar na pasta do livro');
select lives_ok($$ insert into storage.objects (bucket_id, name) values ('books', 'carnegie/1.pdf') $$, 'mentor sobe PDF na pasta do livro');
select throws_ok($$ insert into storage.objects (bucket_id, name) values ('books', 'livro-que-nao-existe/1.pdf') $$, '42501', null, 'mentor não sobe fora da pasta de um livro');

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select throws_ok($$ insert into storage.objects (bucket_id, name) values ('books', 'carnegie/2.pdf') $$, '42501', null, 'aluna não sobe PDF');

select lives_ok($$ insert into public.book_progress (book_id, page, total_pages) values ('carnegie', 3, 200)
  on conflict (book_id) do update set page = excluded.page, total_pages = excluded.total_pages $$, 'aluna salva a página lida');
select throws_ok($$ update public.book_progress set page = 300 where book_id = 'carnegie' $$, '23514', null, 'página não passa do total');

-- checklists: cada um edita as próprias; o outro só lê (RF-42)
insert into public.checklists (id, title) values ('cccccccc-0000-0000-0000-000000000001', 'Vendas da semana');
insert into public.checklist_items (id, checklist_id, text) values ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'Ligar para 5 empresas');

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select is((select count(*)::int from public.checklist_items), 1, 'mentor lê a checklist da aluna');
update public.checklist_items set done_at = now() where id = 'dddddddd-0000-0000-0000-000000000001';
select is((select done_at from public.checklist_items where id = 'dddddddd-0000-0000-0000-000000000001'), null, 'mentor não marca item da aluna');
select throws_ok($$ insert into public.book_progress (book_id, page, total_pages) values ('gitomer', 1, 100) $$, '42501', null, 'mentor não salva página de leitura');

select * from finish();
rollback;
