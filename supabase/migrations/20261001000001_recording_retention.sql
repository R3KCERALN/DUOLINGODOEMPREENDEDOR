-- RF-76j: o áudio é apagado 30 dias depois da nota do mentor (delete_after, calculado pelo recording_guard da E5).
-- O arquivo sai pela API do Storage (Edge Function purge-recordings): o Supabase bloqueia delete direto em
-- storage.objects (storage.protect_delete), que deixaria o arquivo órfão ocupando o 1 GB do plano gratuito.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create or replace function public.due_recordings(p_now timestamptz default now(), p_limit int default 500)
returns table (simulation_id uuid, file_path text)
language sql stable set search_path = '' as $$
  select r.simulation_id, r.file_path
  from public.simulation_recordings r
  where not r.keep and r.delete_after is not null and r.delete_after <= p_now
  order by r.delete_after
  limit greatest(p_limit, 0)
$$;
revoke execute on function public.due_recordings(timestamptz, int) from public, anon, authenticated;
grant execute on function public.due_recordings(timestamptz, int) to service_role;

-- 06:15 UTC = 03:15 em SP. URL do projeto e segredo ficam no Vault (docs/GO-LIVE.md), nunca no repositório.
select cron.schedule('purge-recordings', '15 6 * * *', $cron$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/purge-recordings',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000);
$cron$);
