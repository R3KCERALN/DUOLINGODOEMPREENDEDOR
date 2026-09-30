import { parseInline, parseMarkdown, safeHref } from './markdown'

test('parágrafos, títulos e listas', () => {
  const b = parseMarkdown('# Título\n\nTexto **forte** e *leve*.\n\n- um\n- dois\n\n1. a\n2. b')
  expect(b.map((x) => x.t)).toEqual(['h', 'p', 'ul', 'ol'])
  expect(b[0]).toMatchObject({ t: 'h', level: 1 })
  expect(b[2]).toMatchObject({ t: 'ul' })
  expect((b[2] as { items: unknown[] }).items).toHaveLength(2)
})

test('negrito, itálico, código e link válido', () => {
  expect(parseInline('a **b** *c* `d` [e](https://x.com)')).toEqual([
    { t: 'text', v: 'a ' }, { t: 'strong', c: [{ t: 'text', v: 'b' }] }, { t: 'text', v: ' ' },
    { t: 'em', c: [{ t: 'text', v: 'c' }] }, { t: 'text', v: ' ' }, { t: 'code', v: 'd' }, { t: 'text', v: ' ' },
    { t: 'link', href: 'https://x.com', c: [{ t: 'text', v: 'e' }] },
  ])
})

test('link perigoso vira texto (Review Focus 5)', () => {
  expect(safeHref('javascript:alert(1)')).toBeNull()
  expect(safeHref('data:text/html,<script>')).toBeNull()
  expect(safeHref('HTTPS://ok.com')).toBe('HTTPS://ok.com')
  expect(parseInline('[clique](javascript:alert(1))')).toEqual([{ t: 'text', v: '[clique](javascript:alert(1))' }])
})

test('HTML cru nunca vira marcação: fica como texto', () => {
  expect(parseMarkdown('<script>alert(1)</script>')).toEqual([{ t: 'p', c: [{ t: 'text', v: '<script>alert(1)</script>' }] }])
  expect(parseInline('<img src=x onerror=alert(1)>')).toEqual([{ t: 'text', v: '<img src=x onerror=alert(1)>' }])
})

test('marcações abertas e vazias não quebram nem sobem texto', () => {
  expect(parseInline('2 * 3 e **aberto')).toEqual([{ t: 'text', v: '2 * 3 e **aberto' }])
  expect(parseInline('snake_case_word')).toEqual([{ t: 'text', v: 'snake_case_word' }])
  expect(parseMarkdown('')).toEqual([])
})

test('quebra de linha dentro do parágrafo é mantida; CRLF é aceito', () => {
  expect(parseMarkdown('linha 1\r\nlinha 2')).toEqual([{ t: 'p', c: [{ t: 'text', v: 'linha 1\nlinha 2' }] }])
})
