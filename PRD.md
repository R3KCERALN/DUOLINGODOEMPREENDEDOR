# PRD — Trilha: de iniciante a empresária e grande vendedora

**Versão:** 1.2 · **Data:** 2026-09-29 · **Autor:** Allan Giovanni
**Fonte do conteúdo:** `Trilha de iniciante a empresária e grande vendedora (1).pdf`

---

## 1. Visão geral

Web app (PWA, mobile-first) que transforma a trilha de estudos de 16+ semanas em uma jornada gamificada no estilo Duolingo: as etapas são liberadas aos poucos, a aluna acessa todo o material dentro do app, faz anotações, marca checklists e treina simulados de vendas sorteados numa roleta. O mentor acompanha tudo em um painel com gráficos de desempenho.

### 1.1 Problema
A trilha hoje é um PDF: não mostra o que já foi feito, não libera etapas, os livros não estão acessíveis, as notas dos simulados ficam num caderno e o mentor não tem visão do progresso sem perguntar.

### 1.2 Objetivos
1. A aluna sabe sempre **o que fazer hoje** e **qual é o próximo passo** da trilha.
2. Todo o material (vídeos, PDFs dos livros, cursos) é acessível **de dentro do app**.
3. O mentor vê o progresso e o desempenho **sem precisar perguntar**.
4. Os simulados ficam mais divertidos e variados com a roleta.

### 1.3 Métricas de sucesso
- A aluna usa o app em ≥ 5 dias por semana durante as 4 primeiras semanas.
- 100% dos simulados feitos são registrados com nota (autoavaliação + mentor).
- A média oficial dos simulados atinge as metas da trilha: ≥ 15 na Fase 2 e ≥ 22 no fim da Fase 3.
- O mentor consegue responder "em que semana ela está e como está indo?" em menos de 10 segundos pelo painel.

---

## 2. Usuários e papéis

| Papel | Quem | Pode |
|---|---|---|
| **Aluna** | Namorada do mentor | Estudar a trilha, marcar itens, escrever notas, criar checklists, ler livros, girar a roleta (modo treino), dar autoavaliação nos simulados, ver o próprio painel |
| **Mentor** | Allan | Tudo que a aluna vê (exceto notas marcadas como privadas), enviar PDFs dos livros, girar a roleta (modo surpresa), dar nota nos simulados, editar o banco de cenários, liberar/bloquear etapas manualmente, ver o painel completo |

Existem **apenas 2 contas**. Cadastro público desativado; contas criadas por convite no Supabase.

---

## 3. Escopo

### 3.1 Dentro do escopo (v1)
- Mapa da trilha com desbloqueio progressivo (seção 4.2)
- Tela da semana com vídeos, leitura e prática (4.3)
- Tela "Hoje" com a rotina diária (4.4)
- Checklists automáticas e manuais (4.5)
- Caderno diário e notas livres (4.6)
- Biblioteca com upload de PDFs e leitor embutido (4.7)
- Aba Simulados com roleta de 4 rolos e ficha de avaliação dupla (4.8)
- Treino solo com cartas surpresa (só texto) e gravação de áudio (4.8)
- Painéis de desempenho da aluna e do mentor (4.9)
- Streak baseado no caderno diário obrigatório (4.10)

### 3.2 Fora do escopo (v1)
- Notificações push / "TRIIIM" automático (candidato à v2)
- Cliente simulado por IA (conversa com LLM): descartado na v1 por exigir API paga; candidato à v2
- Gravação de vídeo dos simulados (a v1 grava apenas áudio do treino solo)
- Registro detalhado de vendas reais (coberto por item de checklist)
- XP, ligas, loja, conquistas além do streak
- Edição da estrutura da trilha pela interface (a trilha é conteúdo versionado no código)
- Mais de 2 usuários / multi-tenant
- Modo offline completo (apenas cache básico do PWA)

---

## 4. Requisitos funcionais

### 4.1 Autenticação
- **RF-01** Login por e-mail com magic link (Supabase Auth).
- **RF-02** Cada conta tem um papel fixo (`aluna` ou `mentor`) em `profiles`.
- **RF-03** Cadastro público desativado; só as 2 contas convidadas acessam.

### 4.2 Mapa da trilha (estilo Duolingo)
- **RF-10** O mapa é um caminho vertical de nós agrupados por fase:
  - Fase 1 — Comunicação: semanas 1–4
  - Fase 2 — Vendas: semanas 5–10
  - Fase 3 — Negócios: semanas 11–16
  - Fase 4 — Avançado: temas mensais (Negociação, Comunicação difícil, Falar em público, Marca pessoal, Liderança, Mentalidade financeira)
- **RF-11** Cada nó tem 3 estados: **bloqueado**, **disponível** e **concluído**.
- **RF-12** **Regra de semana:** a semana N+1 é liberada quando todos os itens obrigatórios da semana N estão concluídos.
- **RF-13** **Portão de fase** (regra do PDF: "só avance de fase quando os itens da fase atual estiverem marcados"): a primeira semana da fase seguinte só é liberada quando a última semana da fase atual está concluída **e** todos os itens da checklist de fase estão marcados. O nó do portão aparece no mapa como um "baú" com a checklist da fase.
- **RF-14** Na Fase 4, depois do portão da Fase 3, todos os temas ficam disponíveis e a aluna escolhe 1 por mês.
- **RF-15** O mentor pode **liberar ou bloquear manualmente** qualquer nó (override), com registro de quem fez e quando.
- **RF-16** Não há trava de tempo: se ela concluir tudo antes, a próxima semana é liberada na hora (decisão confirmada pelo mentor).

### 4.3 Tela da semana
- **RF-20** Mostra, para a semana: tema, vídeos, leitura, prática/entrega e (na Fase 1) o degrau da escada do medo.
- **RF-21** Vídeos do YouTube tocam embutidos (`youtube-nocookie.com`) com botão "marcar como assistido".
- **RF-22** A leitura aponta para o livro na Biblioteca.
- **RF-23** A semana exibe a própria checklist automática (4.5) e um atalho para criar uma nota vinculada a ela.

### 4.4 Tela "Hoje"
- **RF-30** Mostra a rotina diária do PDF como checklist do dia, que é reiniciada todo dia:
  1. Aquecimento de voz + pitch de 30 s (5 min)
  2. Leitura ou audiolivro (20 min)
  3. Desafio da escada do medo (Fase 1) ou 1 abordagem real (10 min)
  4. Simulado (1 a 3 por dia)
  5. Vídeo da semana ou curso (15 min)
  6. Caderno: 3 linhas (3 min) — **obrigatório**, fixado no topo da lista até ser preenchido (RF-50)
- **RF-31** Aos domingos, adiciona o item "Revisão da semana (30 min)"; aos sábados, "Simulado chefe (10 min)".
- **RF-32** Mostra o streak atual e o próximo item pendente da trilha.

### 4.5 Checklists
Três tipos:

| Tipo | Origem | Quem marca |
|---|---|---|
| **Automática da semana** | Gerada do conteúdo da semana (1 item por vídeo, leitura e prática) | Aluna |
| **Checklist de fase** | Itens do PDF (seção "Checklist de progresso") | Automático, quando dá para derivar dos dados; senão, a aluna |
| **Manual** | Criada pela aluna ou pelo mentor | Quem tiver acesso |

- **RF-40** Itens de fase derivados automaticamente:
  - "Assistiu aos 6 vídeos da fase": marcado quando todos os vídeos da Fase 1 estão assistidos
  - "Fez todos os 15 cenários pelo menos uma vez": marcado quando os 15 objetivos originais já saíram em simulados avaliados
  - "Média de 15 pontos ou mais na ficha de avaliação": calculado sobre a média oficial dos simulados da Fase 2
  - "Média de 22 pontos ou mais nos simulados difíceis": calculado sobre a média oficial dos simulados difíceis
  - "Concluiu pelo menos 1 curso gratuito do Sebrae" e os demais itens: marcados manualmente
- **RF-41** O mentor pode desmarcar qualquer item marcado manualmente.
- **RF-42** Checklists manuais têm título, itens, vínculo opcional a uma semana e data opcional.

### 4.6 Notas
- **RF-50** **Caderno diário (obrigatório):** uma entrada por dia com 3 campos fixos: *1 coisa que aprendi*, *1 que pratiquei*, *1 para amanhã*.
  - Cada campo exige no mínimo 15 caracteres; não é possível salvar a entrada como "completa" com campos vazios ou curtos.
  - É o **único** critério que conta para o streak (RF-99).
  - O dia D pode ser preenchido até 12:00 do dia D+1 (fuso `America/Sao_Paulo`); nesse caso a entrada recebe a marca **"preenchido com atraso"**. Depois disso o dia fica fechado e aparece como **"em falta"**.
  - O sistema grava `created_at` e `updated_at` reais de cada entrada, definidos pelo banco (não pelo cliente), e o mentor vê esses horários.
  - Se o caderno de ontem está em falta, a tela Hoje mostra um aviso.
- **RF-51** **Notas livres:** título + corpo em Markdown simples, com vínculo opcional a semana, vídeo, livro ou simulado.
- **RF-52** Visibilidade: o caderno diário é **sempre visível para o mentor** (sem opção de ocultar). Notas livres têm um seletor "privada" (**padrão: privada**); notas privadas não são visíveis para o mentor, e isso é garantido no banco (RLS).
- **RF-53** Busca por texto nas notas.
- **RF-54** Salvamento automático (debounce de ~1 s) com indicador "salvo".

### 4.7 Biblioteca
- **RF-60** Lista os 12 materiais do PDF na ordem da trilha, com tipo (livro/curso) e fase.
- **RF-61** **Livros:** o mentor faz upload de PDFs próprios. Somente o mentor pode enviar ou remover arquivos. Limite: 50 MB por arquivo.
- **RF-62** Livros sem arquivo mostram "PDF ainda não disponível" e um campo opcional de link externo (compra ou audiolivro).
- **RF-63** Leitor de PDF embutido (PDF.js) que abre na última página lida e salva a página atual.
- **RF-64** Cursos gratuitos (Sebrae, Fundação Bradesco) abrem por link externo.
- **RF-65** Os PDFs ficam em bucket **privado** e são entregues por URL assinada de curta duração (1 h). Nenhum arquivo é público.

### 4.8 Simulados (aba própria)

#### Roleta
- **RF-70** Máquina estilo caça-níqueis com **4 rolos** que giram com animação e param em sequência (da esquerda para a direita):

| Rolo | Conteúdo | Itens iniciais |
|---|---|---|
| 1. Objetivo | 15 do PDF + novos | ~30 |
| 2. Perfil do cliente | Comportamento de quem o mentor interpreta | ~15 |
| 3. Produto | 7 do PDF + novos | ~20 |
| 4. Complicação surpresa | Objeções e imprevistos | ~12 |

- **RF-71** A dificuldade é definida pela fase atual (regra do PDF) e pode ser alterada manualmente antes de girar:

| Dificuldade | Fase padrão | Complicações sorteadas |
|---|---|---|
| Fácil | 1 | 0 (rolo 4 fixo em "Nenhuma") |
| Médio | 2 | 1 |
| Difícil | 3 e 4 | 2 ou 3 (rolo 4 gira mais de uma vez) |

  Em Médio e Difícil, "Nenhuma" é excluída do rolo 4, e as complicações sorteadas não se repetem no mesmo simulado.
- **RF-72** O sorteio evita repetir o mesmo objetivo dos últimos 3 simulados.
- **RF-73** Botão "girar de novo" enquanto o simulado não foi iniciado.
- **RF-74** Respeita `prefers-reduced-motion` (mostra o resultado sem animação longa).

#### Modos
- **RF-75** **Modo surpresa (mentor gira):** o mentor vê o cenário completo (o papel dele e a meta dela). Para a aluna, o simulado aparece como "Simulado surpresa em andamento", **sem o cenário**. O cenário só é revelado para ela quando o mentor encerra o simulado. O bloqueio é feito no banco (RLS), não só na interface.
- **RF-76** **Modo treino (aluna gira):** ela treina sozinha com **cartas surpresa** e **gravação de áudio** (RF-76a a RF-76g).
- **RF-77** Marcador opcional "Simulado chefe" (10 min, sábado).

#### Treino solo com cartas surpresa
Como no treino não há ninguém fazendo o papel do cliente, o app faz esse papel com cartas reveladas em momentos imprevisíveis.

- **RF-76a** Antes de começar, ela vê apenas: objetivo, meta, perfil do cliente e produto. **As complicações sorteadas ficam ocultas** até aparecerem como cartas.
- **RF-76b** Ao tocar em "Começar", inicia um cronômetro (padrão: 5 min; simulado chefe: 10 min) e a **gravação de áudio** (MediaRecorder; áudio mono, ~24 kbps; limite de 12 min).
- **RF-76c** Durante o treino, o app revela cartas em **momentos aleatórios**: a primeira entre 30 s e 90 s, e as seguintes com pelo menos 45 s de intervalo, todas antes dos últimos 30 s. Cada carta mostra a fala do cliente em primeira pessoa (ex.: *"Olha, achei caro. O concorrente cobra metade."*), **apenas em texto**, com destaque visual e vibração (quando o aparelho suporta).
- **RF-76d** Cartas do treino, pela dificuldade:

| Dificuldade | Cartas de complicação (rolo 4) | Cartas de questionamento do produto |
|---|---|---|
| Fácil | 0 | 1 |
| Médio | 1 | 1 |
| Difícil | 2 ou 3 | 2 |

  As cartas de questionamento vêm do baralho "Questionamentos do produto" (Apêndice B) e colocam em dúvida a qualidade, a garantia, a prova ou a diferença do produto.
- **RF-76e** As cartas **não têm voz**: a fala do cliente aparece só em texto (decisão do mentor). A carta fica na tela até ela tocar em "respondi" ou até a próxima carta.
- **RF-76f** O momento de cada carta fica registrado (segundos desde o início) e vira um **marcador na linha do tempo do áudio**, para o mentor pular direto para a resposta dela.
- **RF-76g** Ao terminar (tempo esgotado ou "Encerrar"), a gravação é enviada ao Storage e ela preenche a autoavaliação. Se o upload falhar, o áudio fica guardado no aparelho (IndexedDB) e é reenviado automaticamente, com aviso "gravação pendente de envio".

#### Acompanhamento dos treinos pelo mentor
- **RF-76h** O mentor tem uma lista **"Treinos para avaliar"** com: data e hora, cenário completo, cartas que apareceram, autoavaliação dela e o player de áudio com marcadores.
- **RF-76i** O mentor pode dar a própria nota em qualquer treino. A partir daí o treino passa a contar na média oficial (RF-82).
- **RF-76j** Retenção das gravações: o áudio é apagado automaticamente **30 dias depois da avaliação do mentor**, a menos que ele marque "guardar". Treinos ainda não avaliados não são apagados.

#### Ficha de avaliação
- **RF-78** Seis critérios, nota de 1 a 5 cada (total de 6 a 30): Abertura, Tom e energia, Perguntas, Escuta, Objeção, Fechamento, com o texto "o que observar" do PDF.
- **RF-79** Campos de feedback no formato do PDF: *1 coisa que foi boa* + *1 coisa para melhorar*.
- **RF-80** Cada um preenche a própria ficha sem ver a nota do outro até os dois enviarem.
- **RF-81** **Nota oficial = média das duas fichas**, por critério e total (arredondada para 1 casa decimal).
- **RF-82** Simulados de modo treino sem ficha do mentor ficam como "Treino" e **não entram** na média oficial (decisão confirmada). Quando o mentor avalia o treino ouvindo a gravação (RF-76i), ele passa a contar.
- **RF-83** Estados do simulado: `sorteado` → `em andamento` → `aguardando notas` → `concluído`.

#### Banco de cenários
- **RF-84** O mentor pode adicionar, editar e desativar itens de cada rolo. Itens desativados não saem mais no sorteio, mas continuam no histórico.
- **RF-85** Cada item do rolo 1 guarda "papel do mentor" e "meta dela"; os itens originais do PDF são marcados como `original` (usado no RF-40).

### 4.9 Painéis de desempenho

**Painel do mentor**
- **RF-90** Cabeçalho: fase e semana atuais, % da trilha concluída, streak, dias estudados nos últimos 7 e 30 dias.
- **RF-91** **Evolução das notas:** linha da média oficial semanal, com linhas de meta em 15 e 22.
- **RF-92** **Autoavaliação × mentor:** duas linhas (nota dela e nota dele) ao longo do tempo, mostrando a diferença de percepção.
- **RF-93** **Radar por critério:** média oficial em cada um dos 6 critérios, comparando as últimas 4 semanas com o período anterior.
- **RF-94** **Mapa de calor de atividade** estilo GitHub (dias com atividade: item marcado, caderno ou simulado).
- **RF-95** **Progresso de checklists:** % concluído por fase.
- **RF-96** **Histórico de simulados:** lista com cenário, dificuldade, notas e feedback.
- **RF-97** Leitura: página atual de cada livro.
- **RF-97a** **Caderno em dia:** taxa de dias com caderno completo desde o início, quantidade de entradas "com atraso", lista dos dias em falta e leitura de qualquer entrada com o horário real em que foi escrita.
- **RF-97b** **Treinos:** quantos treinos ela fez por semana e quantos estão aguardando a avaliação do mentor.

**Painel da aluna**
- **RF-98** Mesmos gráficos de RF-90 a RF-95, com o próprio progresso.

### 4.10 Streak
- **RF-99** Um dia conta como "estudado" **somente** se o caderno diário daquele dia estiver completo (no prazo ou com atraso, conforme RF-50). O dia é calculado no fuso `America/Sao_Paulo`.
- **RF-99a** O mapa de calor (RF-94) continua mostrando toda a atividade (itens, simulados, caderno), mas destaca em cor própria os dias com atividade e **sem caderno**.

---

## 5. Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF-01 | Mobile-first; utilizável a partir de 360 px de largura; instalável como PWA |
| RNF-02 | Interface 100% em pt-BR |
| RNF-03 | Todas as tabelas com RLS ativado; nenhum acesso anônimo |
| RNF-04 | Funciona no plano gratuito de Supabase e Vercel |
| RNF-05 | Primeira carga < 3 s em 4G; roleta a 60 fps em celular médio |
| RNF-06 | Acessibilidade: contraste AA, navegação por teclado, `prefers-reduced-motion` |
| RNF-07 | Nenhum segredo no front-end além da `anon key` pública do Supabase |
| RNF-08 | Os PDFs são de uso pessoal do casal; bucket privado e sem links públicos |
| RNF-09 | Custo zero de API: nenhuma chamada a LLM ou serviço pago; a gravação usa apenas APIs do navegador |
| RNF-10 | Gravação compatível com Chrome/Android (`audio/webm;codecs=opus`) e Safari/iOS (`audio/mp4`); o formato é detectado com `MediaRecorder.isTypeSupported` |
| RNF-11 | Orçamento de Storage (1 GB no plano gratuito): livros ≤ 50 MB cada; áudio ~24 kbps (~1,8 MB por treino de 10 min) com a retenção de RF-76j; o painel do mentor mostra o uso atual do Storage |

---

## 6. Arquitetura

```
┌──────────────────────────┐        ┌──────────────────────────────┐
│  PWA (Vite + React + TS) │◀──────▶│  Supabase                    │
│  hospedado na Vercel     │  HTTPS │  • Auth (magic link)         │
│                          │        │  • Postgres + RLS            │
│  conteúdo da trilha      │        │  • Storage (bucket privado)  │
│  em src/content/*.ts     │        └──────────────────────────────┘
└──────────────────────────┘
```

| Camada | Escolha | Motivo |
|---|---|---|
| Front-end | Vite + React + TypeScript | Simples, rápido, sem SSR necessário |
| Rotas | React Router | Padrão |
| Estado do servidor | TanStack Query | Cache, refetch e estados de carregamento |
| Estilo | Tailwind CSS | Rápido para UI mobile |
| Gráficos | Recharts | Linha, radar e barras prontos |
| Leitor de PDF | PDF.js (`react-pdf`) | Controle de página e progresso |
| Animação da roleta | CSS transforms + Web Animations API | Sem dependência extra |
| Gravação | MediaRecorder (nativo) | Grátis, sem API externa |
| Fila de upload offline | IndexedDB (`idb-keyval`) | Não perder gravação se a rede cair |
| Tarefas agendadas | `pg_cron` no Supabase | Apagar gravações vencidas (RF-76j) e fechar cadernos do dia anterior |
| Backend | Supabase (Auth, Postgres, Storage) | Sem servidor próprio, RLS nativo |
| PWA | `vite-plugin-pwa` | Instalação e cache básico |
| Testes | Vitest, Testing Library, Playwright, testes de RLS com Supabase local | Ver seção 9 |

**Conteúdo da trilha como código:** fases, semanas, vídeos, itens de checklist, rotina e seed do banco de cenários ficam em `src/content/` com **IDs estáveis** (ex.: `w05.video.1`, `f1.gate.3`). O banco guarda apenas o **progresso**, que referencia esses IDs. Mudar a trilha = editar o arquivo e publicar.

---

## 7. Modelo de dados (Postgres)

| Tabela | Campos principais | Observações |
|---|---|---|
| `profiles` | `id` (= auth.uid), `role` (`aluna`\|`mentor`), `name` | 1 linha por usuário |
| `item_progress` | `item_id`, `done_at`, `done_by` | Itens da trilha, de fase e da rotina diária (`routine:<data>:<id>`) |
| `node_overrides` | `node_id`, `state` (`unlocked`\|`locked`), `by`, `at` | Override do mentor (RF-15) |
| `checklists` | `id`, `owner`, `title`, `week_id?`, `due_date?` | Checklists manuais |
| `checklist_items` | `id`, `checklist_id`, `text`, `done_at?`, `position` | |
| `journal_entries` | `date` (única), `learned`, `practiced`, `tomorrow`, `complete`, `late`, `created_at`, `updated_at` | Caderno diário. `complete`, `late` e os horários são calculados por trigger no banco (RF-50); escrita recusada fora do prazo |
| `notes` | `id`, `title`, `body`, `private`, `link_type?`, `link_id?`, `updated_at` | Busca por `tsvector` em pt |
| `books` | `id`, `order`, `title`, `author`, `phase`, `kind`, `file_path?`, `external_url?` | Seed com os 12 itens |
| `book_progress` | `book_id`, `page`, `total_pages`, `updated_at` | |
| `reel_items` | `id`, `reel` (1–4), `label`, `mentor_role?`, `student_goal?`, `client_line?`, `original`, `active` | Banco de cenários. `client_line` (rolo 4) é a fala em primeira pessoa usada na carta surpresa |
| `simulations` | `id`, `mode` (`surpresa`\|`treino`), `difficulty`, `phase`, `status`, `is_boss`, `created_by`, `created_at`, `revealed_at?` | Visível para os dois |
| `simulation_scenarios` | `simulation_id`, `objective_id`, `profile_id`, `product_id`, `complication_ids[]` | **Tabela separada** para o RLS esconder o cenário (RF-75) |
| `simulation_scores` | `simulation_id`, `rater` (`aluna`\|`mentor`), `abertura`…`fechamento` (1–5), `good`, `improve`, `submitted_at` | Única por (simulação, avaliador) |
| `challenge_cards` | `id`, `text`, `active` | Baralho "Questionamentos do produto"; editável pelo mentor |
| `simulation_cards` | `simulation_id`, `kind` (`complicacao`\|`questionamento`), `ref_id`, `shown_at_sec` | Cartas sorteadas no treino e o momento em que apareceram (RF-76f) |
| `simulation_recordings` | `simulation_id`, `file_path`, `mime`, `duration_sec`, `size_bytes`, `keep`, `delete_after?` | Áudio do treino (RF-76b, RF-76j) |
| `v_simulation_official` (view) | `simulation_id`, média por critério, `total_official` | Só quando existem as 2 fichas |

### 7.1 Regras de RLS (resumo)
- `profiles`: cada um lê os 2 perfis; ninguém altera `role`.
- `notes`: a aluna faz tudo nas próprias notas; o mentor lê apenas `private = false`.
- `journal_entries`: a aluna escreve (só no dia atual ou no dia anterior até 12:00, validado no banco); o mentor lê todas. A aluna não pode apagar entradas.
- `simulation_scenarios`: o mentor lê sempre. A aluna lê se `mode = 'treino'` **ou** se a simulação tem `revealed_at` preenchido.
- `simulation_scores`: cada um escreve a própria ficha. A ficha do outro só é legível depois que as duas foram enviadas (RF-80).
- `reel_items`, `books`, `node_overrides`: escrita só do mentor; leitura dos dois.
- Storage `books`: upload e remoção só do mentor; leitura dos dois via URL assinada.
- Storage `recordings`: upload só da aluna, na pasta do próprio simulado; leitura dos dois via URL assinada; remoção só pelo job de retenção ou pelo mentor.
- `simulation_cards` no treino: as complicações ficam ocultas apenas na interface até a carta aparecer. Isso é intencional, porque no treino é ela mesma quem gira; o bloqueio no banco vale só para o modo surpresa (RF-75).
- `challenge_cards`: escrita só do mentor; leitura dos dois.

---

## 8. Telas e navegação

Barra inferior (mobile) com 5 abas:

| Aba | Rota | Conteúdo |
|---|---|---|
| Hoje | `/` | Rotina do dia, streak, próximo passo |
| Trilha | `/trilha`, `/trilha/:weekId` | Mapa e tela da semana |
| Simulados | `/simulados`, `/simulados/:id` | Roleta, simulado em andamento, ficha, histórico |
| Caderno | `/caderno`, `/notas/:id` | Caderno diário, notas livres, checklists manuais |
| Painel | `/painel` | Gráficos (versão mentor ou aluna conforme o papel) |

Rotas secundárias: `/biblioteca`, `/biblioteca/:bookId` (leitor), `/cenarios` (edição do banco, só mentor), `/login`.

---

## 9. Estratégia de testes

| Nível | O que cobre |
|---|---|
| Unitário (Vitest) | Regras de desbloqueio (RF-12 a RF-16), cálculo da nota oficial (RF-81), sorteio da roleta por dificuldade e sem repetição (RF-71, RF-72), agenda das cartas surpresa (RF-76c, RF-76d), cálculo do streak com fuso e caderno atrasado (RF-50, RF-99), derivação de itens de fase (RF-40) |
| RLS e triggers (Supabase local + pgTAP) | Aluna não lê cenário de simulado surpresa não revelado; mentor não lê nota privada; ficha do outro oculta até as duas enviadas; só o mentor faz upload de livros; caderno recusa escrita fora do prazo e marca `late` corretamente; aluna não apaga caderno |
| Componente (Testing Library) | Ficha de avaliação, checklist, caderno com salvamento automático |
| E2E (Playwright, viewport mobile) | Fluxo completo de simulado surpresa com duas sessões (mentor e aluna); treino solo com microfone falso (`--use-fake-device-for-media-stream`) → upload → mentor avalia → entra na média; concluir semana → próxima semana liberada |
| Manual | Gravação em iPhone (Safari) e Android (Chrome) reais |

---

## 10. Marcos

| # | Entrega | Inclui |
|---|---|---|
| M1 | Fundação | Projeto Vite, Supabase, auth, perfis, conteúdo da trilha em código, deploy na Vercel |
| M2 | Trilha | Mapa, tela da semana, desbloqueio, checklists automáticas e de fase, tela Hoje |
| M3 | Simulados | Roleta, modo surpresa, treino solo (cartas em texto, gravação, fila offline), ficha dupla, nota oficial, "Treinos para avaliar", banco de cenários e cartas editável |
| M4 | Caderno e Biblioteca | Caderno diário, notas, checklists manuais, upload de PDF e leitor |
| M5 | Painéis | Gráficos do mentor e da aluna, streak, mapa de calor |
| M6 | Acabamento | PWA, acessibilidade, testes E2E, revisão de segurança |

---

## 11. Riscos e questões em aberto

| Tipo | Item | Decisão atual |
|---|---|---|
| Risco | Direitos autorais dos livros | O mentor envia apenas PDFs que o casal possui, para uso pessoal; bucket privado, sem compartilhamento público |
| Risco | 1 GB de Storage no plano gratuito (livros + áudios) | 50 MB por livro, áudio a ~24 kbps, retenção de 30 dias após avaliação (RF-76j), uso visível no painel (RNF-11) |
| Risco | Vídeos do YouTube removidos ou privados | Link "abrir no YouTube" como fallback; conteúdo editável em `src/content` |
| Risco | iOS pode pausar a gravação com a tela bloqueada | Manter a tela ativa durante o treino (Wake Lock API) e avisar para não bloquear o celular |
| Decisão | Notas livres privadas por padrão (RF-52) | Confirmado |
| Decisão | Caderno diário obrigatório e sempre visível ao mentor (RF-50, RF-52) | Confirmado |
| Decisão | Sem trava de tempo entre semanas (RF-16) | Confirmado |
| Decisão | Treinos sem nota do mentor fora da média oficial (RF-82) | Confirmado |
| Decisão | Treino solo com cartas + gravação, sem IA (RF-76a a RF-76j) | Confirmado; IA fica para a v2 |
| Questão | Notificação "TRIIIM" para simulado surpresa | Fora da v1; avaliar push notifications na v2 |

---

## Apêndice A — Conteúdo da trilha (extraído do PDF)

### Fase 1 — Comunicação (semanas 1–4)
Leitura: *Como Fazer Amigos e Influenciar Pessoas* (Dale Carnegie), 1 capítulo por dia.

| Sem. | Vídeo | URL |
|---|---|---|
| 1 | Vença o medo de falar em público — Reinaldo Polito (3 min) | https://www.youtube.com/watch?v=ywJw8hjzTig |
| 1 | Pedro Calabrez sobre timidez — Cortes do Flow (12 min) | https://www.youtube.com/watch?v=V0Eb9Kk4Ecc |
| 2 | Aula particular de oratória — Reinaldo Polito (7 min) | https://www.youtube.com/watch?v=aect5Ccj6lo |
| 2 | A arte da escuta — Claudio Thebas (7 min) | https://www.youtube.com/watch?v=FiklDZD-DlI |
| 3 | Comece pelo porquê (Simon Sinek) — IlustradaMente (7 min) | https://www.youtube.com/watch?v=LjfortYLy30 |
| 4 | O poder da vulnerabilidade (Brené Brown) — Eureka! (8 min) | https://www.youtube.com/watch?v=ezXJ7QLp7Mw |

Escada do medo: S1 bom dia + 1 pergunta a 3 desconhecidos · S2 desafio do não · S3 vídeo de 1 min + ligar para 3 empresas · S4 falar 3 min em pé para um grupo.
Exercícios fixos: pitch de 30 s (refazer toda semana), leitura em voz alta de 5 min, regra 70/30.

### Fase 2 — Vendas (semanas 5–10)
Leitura: *A Bíblia de Vendas* (Gitomer) e *As Armas da Persuasão* (Cialdini).

| Sem. | Tema | Vídeo | URL | Prática |
|---|---|---|---|---|
| 5 | Mentalidade de vendas | Thiago Concer (9 min) | https://www.youtube.com/watch?v=PuoUyNbeYtM | "Por que as pessoas compram?" em 10 respostas |
| 6 | Prospecção e captura de lead | Script de vendas pelo telefone — Thiago Concer (6 min) + *Receita Previsível*, cap. prospecção | https://www.youtube.com/watch?v=xKlI_mbPfdI | Abertura de 20 s; 5 simulados de captura |
| 7 | Diagnóstico com perguntas | SPIN Selling — Thiago Reis (19 min) | https://www.youtube.com/watch?v=MaN0p5ODB-w | 3 perguntas de cada tipo SPIN |
| 8 | Apresentação de valor | Características, benefícios e vantagens — SuperVendedores (7 min) | https://www.youtube.com/watch?v=M4OGum7zVV8 | Vender 5 objetos da casa em 1 min cada |
| 9 | Quebra de objeções | Como lidar com objeções — Thiago Reis (10 min) | https://www.youtube.com/watch?v=MPRP2eGXdFM | Banco de objeções |
| 10 | Fechamento e pós-venda | 3 técnicas de fechamento — Eduardo Tevah (7 min) | https://www.youtube.com/watch?v=gwuAOJcWauc | Simulados de fechamento; pedir indicação |

Estrutura de ligação em 6 passos: Abertura → Conexão → Diagnóstico → Proposta → Objeção → Fechamento.

### Fase 3 — Negócios (semanas 11–16)
Base: cursos online do Sebrae — https://loja.sebrae.com.br/cursos/cursos-online

| Sem. | Tema | Vídeo(s) | URL | Entrega |
|---|---|---|---|---|
| 11 | Como um negócio funciona | Canvas — Sebrae (17 min) | https://www.youtube.com/watch?v=ZiqKAyqskOA | Canvas de um negócio conhecido |
| 12 | Validar ideia | *A Startup Enxuta* + O que é MVP (5 min) | https://www.youtube.com/watch?v=eRKVmRIgAmw | Entrevistar 5 possíveis clientes |
| 13 | Finanças básicas | Método N.A. — Me Poupe! (15 min); Fluxo de caixa — Sebrae (17 min) | https://www.youtube.com/watch?v=mJtua0m2O40 · https://www.youtube.com/watch?v=Ly7-h532K_4 | Planilha receita/custos/lucro |
| 14 | Precificação | Como calcular o preço de venda — Sebrae (10 min) | https://www.youtube.com/watch?v=0JNoeQr0Z8s | Precificar a ideia |
| 15 | Marketing | 5 estratégias de baixo custo — Sebrae MS (3 min) | https://www.youtube.com/watch?v=dSLhykOui3Y | Perfil/página da oferta |
| 16 | Lançamento | Revisar Fases 2 e 3 | — | Vender para 10 pessoas; anotar sim/não/motivos |

Inspiração: Flávio Augusto (11 min) https://www.youtube.com/watch?v=0rTUOGKkePE · Luiza Trajano — Me Poupe! (27 min) https://www.youtube.com/watch?v=ECZgh2ShdAo

### Fase 4 — Avançado (semana 17+, 1 tema por mês)
- **Negociação:** *Negocie Como Se Sua Vida Dependesse Disso* + Chris Voss e Lewis Howes (1h17) https://www.youtube.com/watch?v=awVq770_UHE
- **Comunicação difícil:** *Comunicação Não-Violenta*
- **Falar em público:** *TED: Falar, Convencer, Emocionar*; gravar 1 apresentação de 5 min por mês
- **Marca pessoal:** postar 3 vezes por semana
- **Liderança:** feedback, metas e delegação
- **Mentalidade financeira:** *Pai Rico, Pai Pobre*; *O Homem Mais Rico da Babilônia*

### Checklists de fase (portões)
- **Fase 1:** assistiu aos 6 vídeos · 4 degraus da escada do medo · ≥ 10 "nãos" · pitch de 30 s gravado sem travar · falou 3 min em pé para um grupo
- **Fase 2:** sabe a estrutura de 6 passos · fez os 15 cenários · respostas para as 5 objeções mais comuns · média ≥ 15 · primeira venda real
- **Fase 3:** Canvas de 1 negócio conhecido + 1 ideia própria · 5 entrevistas · planilha de custos e preço · ofereceu para 10 pessoas · ≥ 1 curso do Sebrae
- **Fase 4:** negociação ganha sem desconto seco · 3 apresentações de 5 min · média ≥ 22 nos difíceis

### Biblioteca (ordem de leitura)
1. Como Fazer Amigos e Influenciar Pessoas — Carnegie (F1)
2. Cursos online Sebrae (F2–3) — https://loja.sebrae.com.br/cursos/cursos-online
3. Escola Virtual Fundação Bradesco (F1–3) — https://www.ev.org.br/
4. A Bíblia de Vendas — Gitomer (F2)
5. SPIN Selling — Rackham (F2)
6. As Armas da Persuasão — Cialdini (F2)
7. Receita Previsível — Ross (F2)
8. A Startup Enxuta — Ries (F3)
9. Business Model Generation — Osterwalder e Pigneur (F3)
10. Pai Rico, Pai Pobre — Kiyosaki (F3–4)
11. Negocie Como Se Sua Vida Dependesse Disso — Voss (F4)
12. Comunicação Não-Violenta — Rosenberg (F4)

Também citados na Fase 4 (entram na Biblioteca como livros extras): *TED: Falar, Convencer, Emocionar* (Gallo) e *O Homem Mais Rico da Babilônia* (Clason).

---

## Apêndice B — Seed do banco de cenários

### Rolo 1 — Objetivo (papel do mentor → meta dela)
**Originais do PDF (`original = true`):**
1. Captura de lead — Dono de padaria, ocupado → Conseguir nome, WhatsApp e melhor horário
2. Captura de lead — Recepcionista que barra a ligação → Chegar ao decisor
3. Agendamento — Gerente interessado mas sem tempo → Marcar reunião com dia e hora
4. Diagnóstico — Cliente que responde curto → Descobrir a dor principal com SPIN
5. Apresentação — Cliente que já usa um concorrente → Mostrar 1 diferencial ligado à dor
6. Objeção de preço — "Tá caro" → Reancorar valor antes de falar em desconto
7. Objeção de tempo — "Vou pensar" → Descobrir a objeção real e marcar próximo passo
8. Objeção de confiança — "Nunca ouvi falar" → Usar prova social e garantia
9. Objeção de autoridade — "Preciso falar com meu sócio" → Envolver o sócio
10. Fechamento — Cliente convencido mas indeciso → Pedir a venda de forma direta e calar
11. Pós-venda — Cliente satisfeito → Pedir 3 indicações
12. Cliente irritado — Atraso na entrega → Acalmar, resolver e manter o cliente
13. Negociação — Pede 30% de desconto → Trocar desconto por contrapartida
14. Networking — Pessoa num evento → Apresentar-se em 30 s e conseguir o contato
15. Reativação — Parou de comprar há 6 meses → Descobrir o motivo e trazer de volta

**Novos:**
16. Follow-up — Lead que sumiu após orçamento → Retomar a conversa e obter um sim ou não claro
17. Venda por WhatsApp — Cliente que só responde por áudio curto → Conduzir até o pagamento pelo chat
18. Upsell — Cliente comprando o plano básico → Oferecer o plano superior com base na necessidade
19. Cross-sell — Cliente fechando um item → Adicionar um complemento relevante
20. Cobrança — Cliente com pagamento atrasado → Receber ou negociar data sem perder o cliente
21. Visita presencial — Dono de loja atrás do balcão → Conseguir 5 minutos de atenção
22. Porta fria — Pessoa abordada na rua ou em feira → Despertar interesse em 15 segundos
23. Renovação — Contrato vencendo → Renovar sem dar desconto
24. Indicação recebida — Contato indicado por um amigo → Usar a indicação para gerar confiança
25. Demonstração — Cliente pede para "ver funcionando" → Demonstrar focando só no que resolve a dor
26. Parceria — Negócio complementar → Propor parceria de indicação mútua
27. Pesquisa de mercado — Possível cliente → Fazer 5 perguntas de validação sem vender
28. Cancelamento — Cliente quer cancelar → Entender o motivo e reter
29. Pedido de desconto em grupo — "Se eu levar 3?" → Precificar volume sem perder margem
30. Recomendação online — Cliente que viu anúncio → Qualificar e levar à compra

### Rolo 2 — Perfil do cliente
Apressado · Desconfiado · Simpático que enrola · Técnico que quer detalhes · Grosso · Indeciso · "Já tenho fornecedor" · Falante que desvia do assunto · Silencioso (respostas curtas) · Pechincheiro · Cético com vendedores · Animado mas sem dinheiro · Chefe que delega tudo · Cliente idoso e cauteloso · Jovem que pesquisa tudo no Google

### Rolo 3 — Produto
**Do PDF:** Plano de internet · Salão de beleza · Curso online · Consultoria · Seguro de carro · Cesta de café da manhã · Software de gestão
**Novos:** Joias/semijoias · Marmita fit · Estética/depilação · Energia solar · Imóvel para alugar · Academia · Plano odontológico · Fotografia de eventos · Doces para festa · Roupas por atacado · Aulas de inglês · Serviço de limpeza · Cosméticos por revenda

### Rolo 4 — Complicação surpresa (rótulo → fala na carta)
| Rótulo | Fala do cliente (`client_line`) |
|---|---|
| Nenhuma | — |
| Tá caro | "Olha, achei caro. Tá fora do meu orçamento." |
| Vou pensar | "Gostei, mas vou pensar e te dou um retorno." |
| Sócio/cônjuge | "Preciso ver isso com meu sócio antes de decidir." |
| Interrupção | "Desculpa, estou entrando numa reunião agora. Resume pra mim em 20 segundos?" |
| Desconto de 30% | "Se você me der 30% de desconto eu fecho agora." |
| Manda por WhatsApp | "Me manda tudo por WhatsApp que eu vejo depois." |
| Concorrente mais barato | "O concorrente faz a mesma coisa pela metade do preço." |
| Experiência ruim anterior | "Já contratei algo assim e foi uma dor de cabeça. Por que seria diferente?" |
| Pergunta difícil | "E como funciona exatamente a parte técnica disso?" |
| Muda de ideia | "Sabe, pensando melhor, acho que agora não é o momento." |
| Garantia por escrito | "Você me garante isso por escrito?" |

### Baralho — Questionamentos do produto (treino solo)
1. "Isso funciona mesmo? Tem alguém que já usou e posso conversar?"
2. "Qual a garantia se eu não gostar?"
3. "Por que eu compraria de você e não de uma empresa grande?"
4. "Já vi isso mais barato na internet. Qual a diferença?"
5. "E se der problema depois da compra, quem me atende?"
6. "Isso parece bom demais pra ser verdade."
7. "Quanto tempo leva pra eu ver resultado?"
8. "Qual a qualidade do material? É durável?"
9. "Vocês existem há quanto tempo?"
10. "Tem nota fiscal?"
11. "Não entendi o que eu ganho com isso. Explica de novo?"
12. "Minha amiga comprou e não gostou."
13. "Tem como testar antes de pagar?"
14. "O que acontece se eu quiser cancelar?"
15. "Por que o preço é esse? Do que ele é composto?"
