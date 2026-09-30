begin;
-- independente das contas locais (profiles_one_per_role): tudo é desfeito pelo rollback no fim
truncate public.profiles cascade;
delete from auth.users;
select plan(9);

select is(array(select c.relname::text from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity), '{}'::text[],
  'RNF-03: toda tabela de public tem RLS');
select is(array(select schemaname || '.' || tablename || '.' || policyname from pg_policies
  where schemaname in ('public', 'storage') and roles <> '{authenticated}'), '{}'::text[],
  'toda política vale só para quem tem sessão');
select is(array(select c.relname::text from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'v' and not coalesce('security_invoker=true' = any(c.reloptions), false)), '{}'::text[],
  'views respeitam o RLS de quem consulta (security_invoker)');
select is(array(select p.proname::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosecdef
    and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')), '{}'::text[],
  'funções security definer fixam o search_path');
select is(array(select p.proname::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')
    and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')), '{}'::text[],
  'sem sessão, nenhuma função do app executa');

select is(array(select id::text from storage.buckets where public), '{}'::text[], 'RNF-08: nenhum bucket público');
select is((select file_size_limit from storage.buckets where id = 'books'), 52428800::bigint, 'livros até 50 MB');
select is((select allowed_mime_types from storage.buckets where id = 'recordings'), array['audio/*'], 'gravações: só áudio');

insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000cc', 'probe@test');
insert into public.profiles values ('00000000-0000-0000-0000-0000000000cc', 'aluna', 'Probe');
set local role anon;
select is((select count(*)::int from public.profiles), 0, 'sem sessão não lê nem os perfis');

select * from finish();
rollback;
