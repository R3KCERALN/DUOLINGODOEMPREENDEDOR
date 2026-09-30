begin;
-- independente das contas locais: tudo é desfeito pelo rollback no fim
truncate public.profiles cascade;
delete from auth.users;
select plan(9);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000a', 'aluna@test');
insert into public.profiles values ('00000000-0000-0000-0000-00000000000a', 'aluna', 'Aluna');

-- montagem como dono do banco: o trigger recording_guard calcularia delete_after; aqui ele é fixado à mão
alter table public.simulation_recordings disable trigger user;
insert into public.simulations (id, mode, difficulty, phase, status, created_by, created_at)
select ('22222222-0000-0000-0000-00000000000' || n)::uuid, 'treino', 'facil', 'f1', 'concluido',
       '00000000-0000-0000-0000-00000000000a', '2026-08-01 12:00:00+00'
from generate_series(1, 4) n;
insert into public.simulation_recordings (simulation_id, file_path, mime, duration_sec, size_bytes, keep, delete_after) values
  ('22222222-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001/a.webm', 'audio/webm', 300, 900000, false, '2026-09-01 12:00:00+00'), -- vencida
  ('22222222-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002/a.webm', 'audio/webm', 300, 900000, true,  '2026-09-01 12:00:00+00'), -- guardada
  ('22222222-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000003/a.m4a',  'audio/mp4',  300, 900000, false, null),                     -- sem nota do mentor
  ('22222222-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000004/a.webm', 'audio/webm', 300, 900000, false, '2026-10-01 12:00:00+00'); -- no prazo
alter table public.simulation_recordings enable trigger user;

select is((select array_agg(simulation_id::text) from public.due_recordings('2026-09-30 12:00:00+00')),
  array['22222222-0000-0000-0000-000000000001'], 'só a vencida entra: guardada, sem nota e no prazo ficam');
select is((select array_agg(simulation_id::text order by simulation_id) from public.due_recordings('2026-10-01 12:00:00+00')),
  array['22222222-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000004'], 'no instante exato do prazo, vence');
select is((select count(*)::int from public.due_recordings('2026-12-31 00:00:00+00', 1)), 1, 'respeita o tamanho do lote');

select ok(not has_function_privilege('authenticated', 'public.due_recordings(timestamptz, integer)', 'execute'), 'aluna e mentor não chamam due_recordings');
select ok(not has_function_privilege('anon', 'public.due_recordings(timestamptz, integer)', 'execute'), 'sem sessão também não');
select ok(has_function_privilege('service_role', 'public.due_recordings(timestamptz, integer)', 'execute'), 'a Edge Function (service_role) chama');

select is((select schedule from cron.job where jobname = 'purge-recordings'), '15 6 * * *', 'roda todo dia às 03:15 de SP (06:15 UTC)');
select matches((select command from cron.job where jobname = 'purge-recordings'), '/functions/v1/purge-recordings', 'chama a Edge Function');
select ok((select command from cron.job where jobname = 'purge-recordings') !~ 'eyJ|sb_secret', 'nenhuma chave no comando do cron: URL e segredo vêm do Vault');

select * from finish();
rollback;
