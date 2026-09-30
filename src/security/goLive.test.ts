/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs'

const doc = existsSync('docs/GO-LIVE.md') ? readFileSync('docs/GO-LIVE.md', 'utf8') : ''

test.each([
  ['variáveis da Vercel', ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']],
  ['banco de produção', ['supabase link', 'supabase db push', 'sa-east-1']],
  ['retenção do áudio (Task 55)', ["vault.create_secret", "'project_url'", "'cron_secret'", 'CRON_SECRET', 'supabase functions deploy purge-recordings', 'cron.job_run_details']],
  ['Auth (RF-03)', ['Site URL', 'Redirect URLs', 'Allow new users to sign up', 'insert into public.profiles']],
  ['segurança (Task 56)', ['Content-Security-Policy', 'securityheaders.com']],
  ['smoke no celular', ['Adicionar à Tela de Início', 'modo avião', 'gravação', 'PDF', 'Wake Lock']],
  ['plano gratuito', ['pausa', '1 GB']],
])('GO-LIVE cobre %s', (_, needles) => {
  for (const n of needles) expect(doc, n).toContain(n)
})
