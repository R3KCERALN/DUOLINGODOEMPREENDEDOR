begin;
-- independente das contas locais: tudo é desfeito pelo rollback no fim
truncate public.profiles cascade;
delete from auth.users;
select plan(18);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'aluna@test'),
  ('00000000-0000-0000-0000-00000000000b', 'mentor@test');
insert into public.profiles values
  ('00000000-0000-0000-0000-00000000000a', 'aluna', 'Aluna'),
  ('00000000-0000-0000-0000-00000000000b', 'mentor', 'Mentor');

-- mentor sorteia um simulado surpresa
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select set_config('t.s', public.create_simulation('surpresa', 'medio', 'f2', false, 'obj-06', 'prof-01', 'prod-01', '{comp-01}')::text, true);
select is((select status::text from public.simulations where id = current_setting('t.s')::uuid), 'sorteado', 'RPC cria o simulado sorteado');
select throws_ok($$ update public.simulations set status = 'aguardando_notas' where id = current_setting('t.s')::uuid $$,
  'P0001', 'invalid_status_transition', 'não pula etapas do ciclo');
update public.simulations set status = 'em_andamento' where id = current_setting('t.s')::uuid;
select isnt((select started_at from public.simulations where id = current_setting('t.s')::uuid), null, 'início registra started_at');

-- aluna: sem cenário e sem ficha enquanto o simulado roda
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select is((select count(*)::int from public.simulation_scenarios), 0, 'aluna não vê o cenário em andamento');
select throws_ok($$ insert into public.simulation_scores (simulation_id, abertura, tom, perguntas, escuta, objecao, fechamento)
  values (current_setting('t.s')::uuid, 3, 3, 3, 3, 3, 3) $$, 'P0001', 'simulation_not_finished', 'ficha só depois do fim');

-- mentor encerra: cenário revelado
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
update public.simulations set status = 'aguardando_notas' where id = current_setting('t.s')::uuid;
select isnt((select revealed_at from public.simulations where id = current_setting('t.s')::uuid), null, 'encerrar revela o cenário');
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select is((select count(*)::int from public.simulation_scenarios), 1, 'aluna vê o cenário depois de encerrado');

-- duas fichas concluem sozinho
insert into public.simulation_scores (simulation_id, abertura, tom, perguntas, escuta, objecao, fechamento)
values (current_setting('t.s')::uuid, 3, 3, 3, 3, 3, 3);
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
insert into public.simulation_scores (simulation_id, abertura, tom, perguntas, escuta, objecao, fechamento)
values (current_setting('t.s')::uuid, 5, 5, 5, 5, 5, 5);
select is((select status::text from public.simulations where id = current_setting('t.s')::uuid), 'concluido', 'duas fichas concluem o simulado');

-- treino da aluna: RPC com cartas
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select set_config('t.t', public.create_simulation('treino', 'medio', 'f2', false, 'obj-06', 'prof-01', 'prod-01', '{comp-01}',
  '[{"position":0,"kind":"complicacao","ref_id":"comp-01"},{"position":1,"kind":"questionamento","ref_id":"card-01"}]'::jsonb)::text, true);
select is((select count(*)::int from public.simulation_cards where simulation_id = current_setting('t.t')::uuid), 2, 'RPC grava as cartas do treino');
select throws_ok($$ update public.simulations set difficulty = 'dificil' where id = current_setting('t.t')::uuid $$,
  'P0001', 'simulation_immutable', 'dificuldade não muda depois de criado');
select throws_ok($$ select public.create_simulation('surpresa', 'facil', 'f1', false, 'obj-01', 'prof-01', 'prod-01', '{comp-00}') $$,
  '42501', null, 'aluna não cria simulado surpresa');

-- gravação e retenção
update public.simulations set status = 'em_andamento' where id = current_setting('t.t')::uuid;
update public.simulations set status = 'aguardando_notas' where id = current_setting('t.t')::uuid;
select throws_ok($$ insert into public.simulation_recordings (simulation_id, file_path, mime, duration_sec, size_bytes)
  values (current_setting('t.t')::uuid, 'outra-pasta/audio.webm', 'audio/webm', 300, 1000) $$,
  '23514', null, 'arquivo precisa estar na pasta do simulado');
insert into public.simulation_recordings (simulation_id, file_path, mime, duration_sec, size_bytes)
values (current_setting('t.t')::uuid, current_setting('t.t') || '/audio.webm', 'audio/webm;codecs=opus', 300, 1000);
select is((select delete_after from public.simulation_recordings where simulation_id = current_setting('t.t')::uuid), null, 'sem nota do mentor o áudio não expira');
select lives_ok($$ insert into storage.objects (bucket_id, name) values ('recordings', current_setting('t.t') || '/audio.webm') $$, 'aluna sobe o áudio na pasta do treino');
select throws_ok($$ insert into storage.objects (bucket_id, name) values ('recordings', current_setting('t.s') || '/audio.webm') $$,
  '42501', null, 'aluna não sobe áudio na pasta de outro simulado');

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
insert into public.simulation_scores (simulation_id, abertura, tom, perguntas, escuta, objecao, fechamento)
values (current_setting('t.t')::uuid, 4, 4, 4, 4, 4, 4);
select isnt((select delete_after from public.simulation_recordings where simulation_id = current_setting('t.t')::uuid), null, 'nota do mentor agenda a exclusão em 30 dias');
select throws_ok($$ update public.simulation_recordings set file_path = 'x/y.webm' where simulation_id = current_setting('t.t')::uuid $$,
  'P0001', 'recording_immutable', 'arquivo da gravação não muda');
update public.simulation_recordings set keep = true where simulation_id = current_setting('t.t')::uuid;
select is((select delete_after from public.simulation_recordings where simulation_id = current_setting('t.t')::uuid), null, 'guardar cancela a exclusão');

select * from finish();
rollback;
