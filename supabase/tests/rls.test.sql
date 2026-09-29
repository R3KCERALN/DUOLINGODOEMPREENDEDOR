begin;
select plan(10);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'aluna@test'),
  ('00000000-0000-0000-0000-00000000000b', 'mentor@test');
insert into public.profiles values
  ('00000000-0000-0000-0000-00000000000a', 'aluna', 'Aluna'),
  ('00000000-0000-0000-0000-00000000000b', 'mentor', 'Mentor');

insert into public.simulations (id, mode, difficulty, phase, created_by)
values ('11111111-1111-1111-1111-111111111111', 'surpresa', 'medio', 'f2', '00000000-0000-0000-0000-00000000000b');
insert into public.simulation_scenarios values ('11111111-1111-1111-1111-111111111111', 'obj-06', 'prof-01', 'prod-01', '{comp-01}');
insert into public.notes (author, title, private) values
  ('00000000-0000-0000-0000-00000000000a', 'segredo', true),
  ('00000000-0000-0000-0000-00000000000a', 'pública', false);

-- como aluna
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select is((select count(*)::int from public.simulation_scenarios), 0, 'aluna não vê cenário surpresa não revelado');
select throws_ok($$ insert into public.reel_items (id, reel, label) values ('x', 1, 'x') $$, '42501', null, 'aluna não edita banco de cenários');
insert into public.simulation_scores (simulation_id, abertura, tom, perguntas, escuta, objecao, fechamento)
values ('11111111-1111-1111-1111-111111111111', 3, 3, 3, 3, 3, 3);
select throws_ok($$ insert into public.simulation_scores (simulation_id, abertura, tom, perguntas, escuta, objecao, fechamento)
  values ('11111111-1111-1111-1111-111111111111', 3, 3, 3, 3, 3, 3) $$, '23505', null, 'ficha duplicada recusada');
select throws_ok($$ update public.simulation_scores set abertura = 6 $$, '23514', null, 'nota fora de 1-5 recusada');

-- como mentor
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select is((select count(*)::int from public.notes), 1, 'mentor vê só a nota não privada');
select is((select count(*)::int from public.simulation_scores), 0, 'mentor não vê ficha da aluna antes de enviar a dele');
insert into public.simulation_scores (simulation_id, abertura, tom, perguntas, escuta, objecao, fechamento)
values ('11111111-1111-1111-1111-111111111111', 5, 5, 5, 5, 5, 5);
update public.simulations set revealed_at = now(), status = 'concluido' where id = '11111111-1111-1111-1111-111111111111';
select is((select total_official from public.v_simulation_official), 24.0::numeric, 'oficial = média (18 e 30)');

-- aluna depois da revelação
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select is((select count(*)::int from public.simulation_scenarios), 1, 'aluna vê cenário após revelação');

-- conta autenticada sem perfil não lê nada
select ok((select count(*)::int from public.books) > 0, 'aluna com perfil lê livros');
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';
select is((select count(*)::int from public.books), 0, 'usuário sem perfil não lê nada');

select * from finish();
rollback;
