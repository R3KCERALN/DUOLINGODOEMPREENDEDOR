export type PhaseId = 'f1' | 'f2' | 'f3' | 'f4'
export type ItemKind = 'video' | 'reading' | 'practice' | 'fear' | 'delivery'
export type AutoCheck = 'f1_all_videos' | 'f2_all_original_objectives' | 'f2_avg_15' | 'f4_hard_avg_22'

export interface TrailItem {
  id: string            // estável, ex.: 'w05.video.1'
  kind: ItemKind
  title: string
  url?: string
  minutes?: number
  bookId?: string       // referencia books.id
  required: boolean
}

export interface TrailNode {
  id: string            // 'w01'…'w16' ou 'f4-negociacao'
  phase: PhaseId
  week?: number
  title: string
  items: TrailItem[]
}

export interface GateItem {
  id: string            // 'f1.gate.1'
  text: string
  auto?: AutoCheck
}

export interface Phase {
  id: PhaseId
  title: string
  nodeIds: string[]     // ordem do caminho
  gate: GateItem[]
}
