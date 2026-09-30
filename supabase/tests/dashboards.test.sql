begin;
-- independente das contas locais: tudo é desfeito pelo rollback no fim
truncate public.profiles cascade;
delete from auth.users;
select plan(16);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'aluna@test'),
  ('00000000-0000-0000-0000-00000000000b', 'mentor@test');
insert into public.profiles values
  ('00000000-0000-0000-0000-00000000000a', 'aluna', 'Aluna'),
  ('00000000-0000-0000-0000-00000000000b', 'mentor', 'Mentor');

-- montagem como dono do banco: as regras de tempo e de status (triggers) ficam de fora só aqui
alter table public.simulation_scores disable trigger user;
alter table public.journal_entries disable trigger user;

insert into public.simulations (id, mode, difficulty, phase, status, created_by, created_at) values
  ('11111111-0000-0000-0000-000000000001', 'surpresa', 'medio',   'f2', 'concluido',        '00000000-0000-0000-0000-00000000000b', '2026-09-29 15:00:00+00'),
  ('11111111-0000-0000-0000-000000000002', 'treino',   'facil',   'f1', 'aguardando_notas', '00000000-0000-0000-0000-00000000000a', '2026-09-29 16:00:00+00'),
  -- 28/09 01:30Z = domingo 27/09 22:30 em SP: pertence à semana de 21/09
  ('11111111-0000-0000-0000-000000000003', 'treino',   'dificil', 'f4', 'concluido',        '00000000-0000-0000-0000-00000000000a', '2026-09-28 01:30:00+00'),
  ('11111111-0000-0000-0000-000000000004', 'surpresa', 'medio',   'f2', 'aguardando_notas', '00000000-0000-0000-0000-00000000000b', '2026-09-29 17:00:00+00');

insert into public.simulation_scores (simulation_id, rater_id, abertura, tom, perguntas, escuta, objecao, fechamento) values
  ('11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 4, 4, 4, 4, 4, 4),
  ('11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b', 3, 3, 3, 3, 3, 3),
  ('11111111-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000a', 3, 3, 3, 3, 3, 3),
  ('11111111-0000-0000-0000-000000000003', '00000000-0000-0000-0000-00000000000a', 5, 5, 5, 5, 5, 5),
  ('11111111-0000-0000-0000-000000000003', '00000000-0000-0000-0000-00000000000b', 4, 4, 4, 4, 4, 4),
  ('11111111-0000-0000-0000-000000000004', '00000000-0000-0000-0000-00000000000b', 2, 2, 2, 2, 2, 2);

-- 29/09 02:30Z = 28/09 23:30 em SP; o item marcado pelo mentor não conta como atividade da aluna
insert into public.item_progress (item_id, done_by, done_at) values
  ('w01.video.1', '00000000-0000-0000-0000-00000000000a', '2026-09-29 02:30:00+00'),
  ('w01.reading', '00000000-0000-0000-0000-00000000000a', '2026-09-29 12:00:00+00'),
  ('w01.video.2', '00000000-0000-0000-0000-00000000000b', '2026-09-20 12:00:00+00');
insert into public.journal_entries (user_id, date, learned, practiced, tomorrow, complete) values
  ('00000000-0000-0000-0000-00000000000a', '2026-09-28', 'aprendi a ouvir o cliente', 'pratiquei o pitch de 30 s', 'ligar para 3 empresas', true),
  ('00000000-0000-0000-0000-00000000000a', '2026-09-25', 'rascunho', '', '', false);

insert into storage.objects (bucket_id, name, metadata) values
  ('books', 'carnegie/1.pdf', '{"size": 1000}'), ('books', 'carnegie/2.pdf', '{"size": 500}'),
  ('recordings', '11111111-0000-0000-0000-000000000002/a.webm', '{"size": 200}');

-- aluna
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select is((select count(*)::int from public.v_score_series), 2, 'aluna vê só os simulados com as duas fichas');
select is((select count(*)::int from public.v_score_series where simulation_id in
  ('11111111-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000004')), 0, 'ficha isolada (dela ou do mentor) não aparece');
select results_eq(
  $$ select student_total, mentor_total, total_official from public.v_score_series where simulation_id = '11111111-0000-0000-0000-000000000001' $$,
  $$ values (24, 18, 21.0::numeric) $$, 'total de cada pessoa e nota oficial');
select is((select abertura from public.v_score_series where simulation_id = '11111111-0000-0000-0000-000000000001'), 3.5::numeric, 'média oficial por critério');
select results_eq(
  $$ select day, week_start from public.v_score_series where simulation_id = '11111111-0000-0000-0000-000000000003' $$,
  $$ values ('2026-09-27'::date, '2026-09-21'::date) $$, 'domingo à noite em SP fica na semana de segunda 21/09');
select results_eq(
  $$ select day, items, simulations, journal from public.v_activity_days order by day $$,
  $$ values ('2026-09-27'::date, 0, 1, false), ('2026-09-28'::date, 1, 0, true), ('2026-09-29'::date, 1, 3, false) $$,
  'atividade por dia em SP; rascunho e item do mentor não contam');
select throws_ok($$ select * from public.storage_usage() $$, '42501', 'mentor_only', 'aluna não vê o uso do Storage');

-- mentor
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select is((select count(*)::int from public.v_score_series), 2, 'mentor vê os mesmos simulados completos');
select is((select count(*)::int from public.v_activity_days), 3, 'mentor vê a atividade');
select ok((select bytes >= 1500 and files >= 2 from public.storage_usage() where bucket = 'books'), 'mentor soma os livros');
select ok((select bytes >= 200 and files >= 1 from public.storage_usage() where bucket = 'recordings'), 'mentor soma as gravações');
select is((select bytes from public.storage_usage() where bucket = 'books'),
  (select sum((metadata ->> 'size')::bigint)::bigint from storage.objects where bucket_id = 'books'), 'soma confere com o Storage');
select is((select count(*)::int from public.storage_usage() where bucket not in ('books', 'recordings')), 0, 'só os dois buckets do app');

-- visitante sem login
reset role;
set local role anon;
select throws_ok($$ select count(*) from public.v_score_series $$, '42501', null, 'anônimo não lê a série de notas');
select throws_ok($$ select count(*) from public.v_activity_days $$, '42501', null, 'anônimo não lê a atividade');
select throws_ok($$ select * from public.storage_usage() $$, '42501', null, 'anônimo não executa storage_usage');

select * from finish();
rollback;
