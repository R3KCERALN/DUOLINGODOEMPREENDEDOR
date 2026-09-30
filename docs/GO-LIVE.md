# Go-live do Trilha

Roteiro para colocar o app em produção. Marque cada caixa. **[você]** = passo que só o dono das contas faz; **[dev]** = comando no terminal do projeto. Nenhuma chave vai para o repositório: elas ficam na Vercel, no Vault do Supabase e nos secrets das Edge Functions.

## 1. Contas [você]

- [ ] GitHub: repositório **privado** com o código (`git push`).
- [ ] Supabase: projeto novo no plano Free, região **South America (São Paulo) — sa-east-1**. Guarde a senha do banco num gerenciador de senhas.
- [ ] Vercel: projeto importando o repositório do GitHub (framework Vite, build `npm run build`, saída `dist`).

## 2. Banco de produção [dev]

- [ ] `npx supabase login` e `npx supabase link --project-ref <ref>` (o `<ref>` está na URL do painel do projeto).
- [ ] `npx supabase db push --include-seed` — aplica todas as migrations (inclusive `pg_cron`, `pg_net`, a retenção e o endurecimento de segurança) e carrega o seed de conteúdo (cenários da roleta, cartas e lista de livros; sem usuários).
- [ ] Painel → Database → Extensions: `pg_cron` e `pg_net` aparecem ativas.
- [ ] Painel → Storage: buckets `books` e `recordings` existem e estão **privados**.

## 3. Retenção do áudio (RF-76j) [dev + você]

- [ ] Gere o segredo: `openssl rand -hex 32` (guarde; ele vai em dois lugares).
- [ ] SQL Editor do painel:
  ```sql
  select vault.create_secret('https://<ref>.supabase.co', 'project_url');
  select vault.create_secret('<segredo>', 'cron_secret');
  ```
- [ ] `npx supabase secrets set CRON_SECRET=<segredo>`
- [ ] `npx supabase functions deploy purge-recordings --no-verify-jwt`
- [ ] Teste: `curl -s -X POST -H "x-cron-secret: <segredo>" https://<ref>.supabase.co/functions/v1/purge-recordings` → `{"purged":0}`; sem o cabeçalho → `forbidden` (403).
- [ ] No dia seguinte: `select status, return_message, start_time from cron.job_run_details order by start_time desc limit 3;` → `succeeded` às 06:15 UTC (03:15 em SP).

## 4. Autenticação [você]

- [ ] Authentication → Sign In / Providers → Email: ligado. **Allow new users to sign up: desligado** (RF-03; o `enable_signup = false` do `config.toml` vale só no local).
- [ ] Authentication → URL Configuration → **Site URL** = `https://<domínio de produção>`; **Redirect URLs** = `https://<domínio de produção>/**` e, para os previews da Vercel, `https://*-<time>.vercel.app/**`.
- [ ] Authentication → Users → **Invite user** para os 2 e-mails (aluna e mentor). Depois, no SQL Editor:
  ```sql
  insert into public.profiles (id, role, name) select id, 'aluna', '<Nome da aluna>' from auth.users where email = '<e-mail da aluna>';
  insert into public.profiles (id, role, name) select id, 'mentor', '<Nome do mentor>' from auth.users where email = '<e-mail do mentor>';
  ```
- [ ] O e-mail do Supabase Free tem limite baixo por hora: suficiente para 2 pessoas; se o magic link demorar, espere antes de pedir outro.

## 5. Vercel [você]

- [ ] Settings → Environment Variables (Production e Preview): `VITE_SUPABASE_URL` = `https://<ref>.supabase.co` e `VITE_SUPABASE_ANON_KEY` = a chave pública (anon/publishable) do painel → Project Settings → API. Nenhuma outra chave vai para a Vercel.
- [ ] Deploy. O `npm run build` falha se o orçamento de bundle estourar (Task 57): leia a mensagem do `check-bundle` no log.
- [ ] (Opcional) Domínio próprio em Settings → Domains; depois volte ao passo 4 e troque a Site URL.

## 6. Cabeçalhos de segurança [dev]

- [ ] `curl -sI https://<domínio> | grep -iE "content-security-policy|x-frame-options|strict-transport"` → as três linhas.
- [ ] https://securityheaders.com com o domínio → nota A ou melhor.

## 7. Smoke no celular [você]

No Android (Chrome) e no iPhone (Safari), com as duas contas:

- [ ] Login por magic link abre o app já logado.
- [ ] Instalar: Android → menu → "Instalar app"; iPhone → Compartilhar → **Adicionar à Tela de Início**. O ícone é o lobo em dither sobre fundo escuro e o app abre sem a barra do navegador.
- [ ] Trilha → semana 1: o vídeo do YouTube toca.
- [ ] Biblioteca (mentor envia um PDF de teste; aluna abre): o **PDF** aparece e a página é lembrada ao voltar.
- [ ] Treino solo de 1 minuto: a tela não apaga (Wake Lock; no iPhone, iOS 16.4 ou mais novo), a **gravação** é enviada e o mentor ouve no "Treinos para avaliar".
- [ ] Ative o **modo avião** com o app aberto: aparece "Sem internet"; feche e abra o app: ele abre do cache. Desative o modo avião: tudo volta.
- [ ] Painel do mentor mostra o uso do Storage; o da aluna não.
- [ ] Publique uma mudança qualquer: com o app aberto aparece "Nova versão do app disponível"; "Atualizar" recarrega.
- [ ] No Chrome do computador, com o app aberto em DevTools → Console: nenhuma mensagem de Content-Security-Policy durante o roteiro acima.

## 8. Plano gratuito [você]

- [ ] O Supabase Free **pausa** o projeto depois de 7 dias sem uso. Com o uso diário não acontece; se acontecer, painel → Restore project (os dados ficam).
- [ ] Storage de **1 GB**: o painel do mentor avisa a partir de 80%. Livros até 50 MB; áudio apagado 30 dias depois da nota (a menos que "Guardar").
- [ ] Sem backup automático no Free: de vez em quando, `npx supabase db dump --data-only -f backup-<data>.sql` (guarde fora do repositório).
