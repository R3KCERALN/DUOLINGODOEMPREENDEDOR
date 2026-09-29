import type { Phase, TrailNode } from './types'

const yt = (id: string) => `https://www.youtube.com/watch?v=${id}`

export const NODES: TrailNode[] = [
  {
    id: 'w01', phase: 'f1', week: 1, title: 'Perder o medo de falar',
    items: [
      { id: 'w01.video.1', kind: 'video', title: 'Vença o medo de falar em público — Reinaldo Polito', url: yt('ywJw8hjzTig'), minutes: 3, required: true },
      { id: 'w01.video.2', kind: 'video', title: 'Pedro Calabrez sobre timidez — Cortes do Flow', url: yt('V0Eb9Kk4Ecc'), minutes: 12, required: true },
      { id: 'w01.reading', kind: 'reading', title: 'Como Fazer Amigos e Influenciar Pessoas — 1 capítulo por dia', bookId: 'carnegie', required: true },
      { id: 'w01.fear', kind: 'fear', title: 'Bom dia + 1 pergunta a 3 desconhecidos', required: true },
      { id: 'w01.pitch', kind: 'practice', title: 'Pitch pessoal de 30 s', required: true },
    ],
  },
  {
    id: 'w02', phase: 'f1', week: 2, title: 'Oratória e escuta',
    items: [
      { id: 'w02.video.1', kind: 'video', title: 'Aula particular de oratória — Reinaldo Polito', url: yt('aect5Ccj6lo'), minutes: 7, required: true },
      { id: 'w02.video.2', kind: 'video', title: 'A arte da escuta — Claudio Thebas', url: yt('FiklDZD-DlI'), minutes: 7, required: true },
      { id: 'w02.reading', kind: 'reading', title: 'Como Fazer Amigos e Influenciar Pessoas — 1 capítulo por dia', bookId: 'carnegie', required: true },
      { id: 'w02.fear', kind: 'fear', title: 'Desafio do não', required: true },
      { id: 'w02.pitch', kind: 'practice', title: 'Pitch pessoal de 30 s (refazer)', required: true },
    ],
  },
  {
    id: 'w03', phase: 'f1', week: 3, title: 'Comece pelo porquê',
    items: [
      { id: 'w03.video.1', kind: 'video', title: 'Comece pelo porquê (Simon Sinek) — IlustradaMente', url: yt('LjfortYLy30'), minutes: 7, required: true },
      { id: 'w03.reading', kind: 'reading', title: 'Como Fazer Amigos e Influenciar Pessoas — 1 capítulo por dia', bookId: 'carnegie', required: true },
      { id: 'w03.fear', kind: 'fear', title: 'Vídeo de 1 min + ligar para 3 empresas', required: true },
      { id: 'w03.pitch', kind: 'practice', title: 'Pitch pessoal de 30 s (refazer)', required: true },
    ],
  },
  {
    id: 'w04', phase: 'f1', week: 4, title: 'Vulnerabilidade e presença',
    items: [
      { id: 'w04.video.1', kind: 'video', title: 'O poder da vulnerabilidade (Brené Brown) — Eureka!', url: yt('ezXJ7QLp7Mw'), minutes: 8, required: true },
      { id: 'w04.reading', kind: 'reading', title: 'Como Fazer Amigos e Influenciar Pessoas — 1 capítulo por dia', bookId: 'carnegie', required: true },
      { id: 'w04.fear', kind: 'fear', title: 'Falar 3 min em pé para um grupo', required: true },
      { id: 'w04.pitch', kind: 'practice', title: 'Pitch pessoal de 30 s (refazer)', required: true },
    ],
  },
  {
    id: 'w05', phase: 'f2', week: 5, title: 'Mentalidade de vendas',
    items: [
      { id: 'w05.video.1', kind: 'video', title: 'Como ter a mentalidade de um vendedor acima da média — Thiago Concer', url: yt('PuoUyNbeYtM'), minutes: 9, required: true },
      { id: 'w05.reading', kind: 'reading', title: 'A Bíblia de Vendas', bookId: 'gitomer', required: true },
      { id: 'w05.practice', kind: 'practice', title: 'Escrever "por que as pessoas compram?" em 10 respostas', required: true },
    ],
  },
  {
    id: 'w06', phase: 'f2', week: 6, title: 'Prospecção e captura de lead',
    items: [
      { id: 'w06.video.1', kind: 'video', title: 'Script de vendas pelo telefone — Thiago Concer', url: yt('xKlI_mbPfdI'), minutes: 6, required: true },
      { id: 'w06.reading', kind: 'reading', title: 'Receita Previsível — capítulo de prospecção', bookId: 'ross', required: true },
      { id: 'w06.practice.1', kind: 'practice', title: 'Abertura de 20 s', required: true },
      { id: 'w06.practice.2', kind: 'practice', title: '5 simulados de captura', required: true },
    ],
  },
  {
    id: 'w07', phase: 'f2', week: 7, title: 'Diagnóstico com perguntas',
    items: [
      { id: 'w07.video.1', kind: 'video', title: 'SPIN Selling — Thiago Reis', url: yt('MaN0p5ODB-w'), minutes: 19, required: true },
      { id: 'w07.reading', kind: 'reading', title: 'SPIN Selling', bookId: 'rackham', required: true },
      { id: 'w07.practice', kind: 'practice', title: '3 perguntas de cada tipo SPIN', required: true },
    ],
  },
  {
    id: 'w08', phase: 'f2', week: 8, title: 'Apresentação de valor',
    items: [
      { id: 'w08.video.1', kind: 'video', title: 'Características, benefícios e vantagens — SuperVendedores', url: yt('M4OGum7zVV8'), minutes: 7, required: true },
      { id: 'w08.practice', kind: 'practice', title: 'Vender 5 objetos da casa em 1 min cada', required: true },
    ],
  },
  {
    id: 'w09', phase: 'f2', week: 9, title: 'Quebra de objeções',
    items: [
      { id: 'w09.video.1', kind: 'video', title: 'Como lidar com objeções — Thiago Reis', url: yt('MPRP2eGXdFM'), minutes: 10, required: true },
      { id: 'w09.reading', kind: 'reading', title: 'As Armas da Persuasão', bookId: 'cialdini', required: true },
      { id: 'w09.practice', kind: 'practice', title: 'Montar o banco de objeções', required: true },
    ],
  },
  {
    id: 'w10', phase: 'f2', week: 10, title: 'Fechamento e pós-venda',
    items: [
      { id: 'w10.video.1', kind: 'video', title: '3 técnicas de fechamento — Eduardo Tevah', url: yt('gwuAOJcWauc'), minutes: 7, required: true },
      { id: 'w10.practice.1', kind: 'practice', title: 'Simulados de fechamento', required: true },
      { id: 'w10.practice.2', kind: 'practice', title: 'Pedir indicação', required: true },
    ],
  },
  {
    id: 'w11', phase: 'f3', week: 11, title: 'Como um negócio funciona',
    items: [
      { id: 'w11.video.1', kind: 'video', title: 'Canvas — Sebrae', url: yt('ZiqKAyqskOA'), minutes: 17, required: true },
      { id: 'w11.reading', kind: 'reading', title: 'Business Model Generation', bookId: 'osterwalder', required: true },
      { id: 'w11.delivery', kind: 'delivery', title: 'Canvas de um negócio conhecido', required: true },
    ],
  },
  {
    id: 'w12', phase: 'f3', week: 12, title: 'Validar ideia',
    items: [
      { id: 'w12.video.1', kind: 'video', title: 'O que é MVP', url: yt('eRKVmRIgAmw'), minutes: 5, required: true },
      { id: 'w12.reading', kind: 'reading', title: 'A Startup Enxuta', bookId: 'ries', required: true },
      { id: 'w12.delivery', kind: 'delivery', title: 'Entrevistar 5 possíveis clientes', required: true },
    ],
  },
  {
    id: 'w13', phase: 'f3', week: 13, title: 'Finanças básicas',
    items: [
      { id: 'w13.video.1', kind: 'video', title: 'Método N.A. — Me Poupe!', url: yt('mJtua0m2O40'), minutes: 15, required: true },
      { id: 'w13.video.2', kind: 'video', title: 'Fluxo de caixa — Sebrae', url: yt('Ly7-h532K_4'), minutes: 17, required: true },
      { id: 'w13.delivery', kind: 'delivery', title: 'Planilha de receita, custos e lucro', required: true },
    ],
  },
  {
    id: 'w14', phase: 'f3', week: 14, title: 'Precificação',
    items: [
      { id: 'w14.video.1', kind: 'video', title: 'Como calcular o preço de venda — Sebrae', url: yt('0JNoeQr0Z8s'), minutes: 10, required: true },
      { id: 'w14.delivery', kind: 'delivery', title: 'Precificar a ideia', required: true },
    ],
  },
  {
    id: 'w15', phase: 'f3', week: 15, title: 'Marketing',
    items: [
      { id: 'w15.video.1', kind: 'video', title: '5 estratégias de baixo custo — Sebrae MS', url: yt('dSLhykOui3Y'), minutes: 3, required: true },
      { id: 'w15.delivery', kind: 'delivery', title: 'Perfil/página da oferta', required: true },
    ],
  },
  {
    id: 'w16', phase: 'f3', week: 16, title: 'Lançamento',
    items: [
      { id: 'w16.review', kind: 'practice', title: 'Revisar as Fases 2 e 3', required: true },
      { id: 'w16.delivery', kind: 'delivery', title: 'Vender para 10 pessoas; anotar sim/não/motivos', required: true },
      { id: 'w16.video.1', kind: 'video', title: 'Inspiração: Flávio Augusto', url: yt('0rTUOGKkePE'), minutes: 11, required: false },
      { id: 'w16.video.2', kind: 'video', title: 'Inspiração: Luiza Trajano — Me Poupe!', url: yt('ECZgh2ShdAo'), minutes: 27, required: false },
    ],
  },
  {
    id: 'f4-negociacao', phase: 'f4', title: 'Negociação',
    items: [
      { id: 'f4-negociacao.reading', kind: 'reading', title: 'Negocie Como Se Sua Vida Dependesse Disso', bookId: 'voss', required: true },
      { id: 'f4-negociacao.video.1', kind: 'video', title: 'Chris Voss e Lewis Howes', url: yt('awVq770_UHE'), minutes: 77, required: true },
    ],
  },
  {
    id: 'f4-comunicacao', phase: 'f4', title: 'Comunicação difícil',
    items: [
      { id: 'f4-comunicacao.reading', kind: 'reading', title: 'Comunicação Não-Violenta', bookId: 'rosenberg', required: true },
    ],
  },
  {
    id: 'f4-publico', phase: 'f4', title: 'Falar em público',
    items: [
      { id: 'f4-publico.reading', kind: 'reading', title: 'TED: Falar, Convencer, Emocionar', bookId: 'gallo', required: true },
      { id: 'f4-publico.delivery', kind: 'delivery', title: 'Gravar 1 apresentação de 5 min', required: true },
    ],
  },
  {
    id: 'f4-marca', phase: 'f4', title: 'Marca pessoal',
    items: [
      { id: 'f4-marca.practice', kind: 'practice', title: 'Postar 3 vezes por semana', required: true },
    ],
  },
  {
    id: 'f4-lideranca', phase: 'f4', title: 'Liderança',
    items: [
      { id: 'f4-lideranca.practice', kind: 'practice', title: 'Feedback, metas e delegação', required: true },
    ],
  },
  {
    id: 'f4-financas', phase: 'f4', title: 'Mentalidade financeira',
    items: [
      { id: 'f4-financas.reading.1', kind: 'reading', title: 'Pai Rico, Pai Pobre', bookId: 'kiyosaki', required: true },
      { id: 'f4-financas.reading.2', kind: 'reading', title: 'O Homem Mais Rico da Babilônia', bookId: 'clason', required: true },
    ],
  },
]

export const PHASES: Phase[] = [
  {
    id: 'f1', title: 'Comunicação', nodeIds: ['w01', 'w02', 'w03', 'w04'],
    gate: [
      { id: 'f1.gate.1', text: 'Assistiu aos 6 vídeos da fase', auto: 'f1_all_videos' },
      { id: 'f1.gate.2', text: 'Completou os 4 degraus da escada do medo' },
      { id: 'f1.gate.3', text: 'Recebeu pelo menos 10 "nãos" no desafio do não' },
      { id: 'f1.gate.4', text: 'Pitch de 30 s gravado sem travar' },
      { id: 'f1.gate.5', text: 'Falou 3 min em pé para um grupo' },
    ],
  },
  {
    id: 'f2', title: 'Vendas', nodeIds: ['w05', 'w06', 'w07', 'w08', 'w09', 'w10'],
    gate: [
      { id: 'f2.gate.1', text: 'Sabe a estrutura de ligação em 6 passos' },
      { id: 'f2.gate.2', text: 'Fez os 15 cenários originais', auto: 'f2_all_original_objectives' },
      { id: 'f2.gate.3', text: 'Tem resposta para as 5 objeções mais comuns' },
      { id: 'f2.gate.4', text: 'Média de simulados ≥ 15', auto: 'f2_avg_15' },
      { id: 'f2.gate.5', text: 'Fez a primeira venda real' },
    ],
  },
  {
    id: 'f3', title: 'Negócios', nodeIds: ['w11', 'w12', 'w13', 'w14', 'w15', 'w16'],
    gate: [
      { id: 'f3.gate.1', text: 'Canvas de 1 negócio conhecido + 1 ideia própria' },
      { id: 'f3.gate.2', text: 'Fez 5 entrevistas com possíveis clientes' },
      { id: 'f3.gate.3', text: 'Planilha de custos e preço pronta' },
      { id: 'f3.gate.4', text: 'Ofereceu para 10 pessoas' },
      { id: 'f3.gate.5', text: 'Fez pelo menos 1 curso do Sebrae' },
    ],
  },
  {
    id: 'f4', title: 'Avançado',
    nodeIds: ['f4-negociacao', 'f4-comunicacao', 'f4-publico', 'f4-marca', 'f4-lideranca', 'f4-financas'],
    gate: [
      { id: 'f4.gate.1', text: 'Negociação ganha sem desconto seco' },
      { id: 'f4.gate.2', text: '3 apresentações de 5 min gravadas' },
      { id: 'f4.gate.3', text: 'Média ≥ 22 nos simulados difíceis', auto: 'f4_hard_avg_22' },
    ],
  },
]

const byId = new Map(NODES.map((n) => [n.id, n]))
export function nodeById(id: string): TrailNode {
  const n = byId.get(id)
  if (!n) throw new Error(`Nó desconhecido: ${id}`)
  return n
}
