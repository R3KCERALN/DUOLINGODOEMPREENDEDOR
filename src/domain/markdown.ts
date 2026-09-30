export type Inline =
  | { t: 'text'; v: string }
  | { t: 'strong'; c: Inline[] }
  | { t: 'em'; c: Inline[] }
  | { t: 'code'; v: string }
  | { t: 'link'; href: string; c: Inline[] }

export type Block =
  | { t: 'p'; c: Inline[] }
  | { t: 'h'; level: 1 | 2 | 3; c: Inline[] }
  | { t: 'ul'; items: Inline[][] }
  | { t: 'ol'; items: Inline[][] }

/** Só http(s) e mailto viram link; qualquer outra coisa (javascript:, data:…) fica como texto. */
export function safeHref(raw: string): string | null {
  return /^(https?:\/\/|mailto:)/i.test(raw) ? raw : null
}

export function parseInline(s: string): Inline[] {
  const out: Inline[] = []
  let buf = ''
  let i = 0
  const flush = () => { if (buf) { out.push({ t: 'text', v: buf }); buf = '' } }
  while (i < s.length) {
    if (s.startsWith('**', i)) {
      const j = s.indexOf('**', i + 2)
      if (j > i + 2) { flush(); out.push({ t: 'strong', c: parseInline(s.slice(i + 2, j)) }); i = j + 2; continue }
    }
    const ch = s[i]
    if (ch === '*' && s[i + 1] !== ' ') {
      const j = s.indexOf('*', i + 1)
      if (j > i + 1) { flush(); out.push({ t: 'em', c: parseInline(s.slice(i + 1, j)) }); i = j + 1; continue }
    }
    if (ch === '`') {
      const j = s.indexOf('`', i + 1)
      if (j > i + 1) { flush(); out.push({ t: 'code', v: s.slice(i + 1, j) }); i = j + 1; continue }
    }
    if (ch === '[') {
      const m = /^\[([^\]]+)\]\(([^)\s]+)\)/.exec(s.slice(i))
      if (m) {
        const href = safeHref(m[2])
        if (href) { flush(); out.push({ t: 'link', href, c: parseInline(m[1]) }) } else buf += m[0]
        i += m[0].length
        continue
      }
    }
    buf += ch
    i++
  }
  flush()
  return out
}

/** Markdown simples (RF-51): parágrafos, títulos `#`–`###`, listas `-`/`*` e `1.`, **negrito**, *itálico*, `código` e [links](https://…). Nada de HTML. */
export function parseMarkdown(src: string): Block[] {
  const blocks: Block[] = []
  let para: string[] = []
  let list: { kind: 'ul' | 'ol'; items: string[] } | null = null
  const flushPara = () => { if (para.length) { blocks.push({ t: 'p', c: parseInline(para.join('\n')) }); para = [] } }
  const flushList = () => { if (list) { blocks.push({ t: list.kind, items: list.items.map(parseInline) }); list = null } }

  for (const line of src.replace(/\r\n?/g, '\n').split('\n')) {
    const heading = /^(#{1,3})\s+(.+)$/.exec(line)
    const bullet = /^\s*[-*]\s+(.+)$/.exec(line)
    const numbered = /^\s*\d+\.\s+(.+)$/.exec(line)
    if (line.trim() === '') { flushPara(); flushList(); continue }
    if (heading) { flushPara(); flushList(); blocks.push({ t: 'h', level: heading[1].length as 1 | 2 | 3, c: parseInline(heading[2]) }); continue }
    const item = bullet ?? numbered
    if (item) {
      flushPara()
      const kind = bullet ? 'ul' : 'ol'
      if (list && list.kind !== kind) flushList()
      list ??= { kind, items: [] }
      list.items.push(item[1])
      continue
    }
    flushList()
    para.push(line)
  }
  flushPara()
  flushList()
  return blocks
}
