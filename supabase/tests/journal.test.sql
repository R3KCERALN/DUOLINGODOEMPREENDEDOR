begin;
select plan(8);

-- 29/09 às 23:59 SP = 30/09 02:59Z
select is(public.journal_window('2026-09-29', '2026-09-30T02:59:00Z'), 'on_time', 'mesmo dia em SP');
-- 30/09 11:59 SP = 14:59Z
select is(public.journal_window('2026-09-29', '2026-09-30T14:59:00Z'), 'late', 'ontem antes do meio-dia');
select is(public.journal_window('2026-09-29', '2026-09-30T15:00:00Z'), 'closed', 'ontem ao meio-dia fecha');
select is(public.journal_window('2026-09-27', '2026-09-30T10:00:00Z'), 'closed', 'anteontem fechado');
select is(public.journal_window('2026-10-01', '2026-09-30T10:00:00Z'), 'closed', 'futuro fechado');

-- trigger: completude calculada no banco
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000a', 'aluna@test');
insert into public.profiles values ('00000000-0000-0000-0000-00000000000a', 'aluna', 'Aluna');
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

insert into public.journal_entries (date, learned, practiced, tomorrow, complete)
values (timezone('America/Sao_Paulo', now())::date, 'aprendi algo útil hoje', 'curto', 'amanhã vou treinar mais', true);
select is((select complete from public.journal_entries limit 1), false, 'cliente não força complete; campo curto');

select throws_ok(
  $$ update public.journal_entries set date = date - 1 $$,
  'P0001', 'journal_date_immutable', 'data de entrada existente não pode mudar');

select throws_ok(
  $$ insert into public.journal_entries (date, learned, practiced, tomorrow)
     values (timezone('America/Sao_Paulo', now())::date - 5, 'x', 'y', 'z') $$,
  'P0001', 'journal_closed', 'recusa dia fechado');

select * from finish();
rollback;
