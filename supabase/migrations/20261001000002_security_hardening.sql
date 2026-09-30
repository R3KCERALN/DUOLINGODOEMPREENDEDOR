-- Revisão final (RNF-03, §7.1): sem sessão (anon) nenhuma função do app executa. O RLS já barrava o efeito,
-- mas both_scored é security definer e responderia sobre qualquer simulado.
-- PUBLIC tem EXECUTE por padrão e anon herda de PUBLIC: revoga dos dois e devolve a quem tem sessão.
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated, service_role;
-- exceções que continuam só do servidor
revoke execute on function public.due_recordings(timestamptz, int) from authenticated;
-- Funções futuras: o EXECUTE de PUBLIC é padrão global do Postgres e não se revoga por schema; revogar global
-- tiraria também o EXECUTE das funções de extensões (pgTAP incluso). Por isso cada migration nova faz
-- `revoke execute on function … from public, anon`, e o security.test.sql falha se alguém esquecer.
