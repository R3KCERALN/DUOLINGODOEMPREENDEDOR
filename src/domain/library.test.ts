import { bookFilePath, clampPage, MAX_PDF_BYTES, normalizeExternalUrl, phaseLabel, validatePdfFile } from './library'

test('só PDF de até 50 MB (RF-61)', () => {
  expect(validatePdfFile({ name: 'a.pdf', size: 1000, type: 'application/pdf' })).toBeNull()
  expect(validatePdfFile({ name: 'a.pdf', size: 1000, type: '' })).toBeNull()
  expect(validatePdfFile({ name: 'a.exe', size: 1000, type: 'application/x-msdownload' })).toMatch(/PDF/)
  expect(validatePdfFile({ name: 'a.png', size: 1000, type: '' })).toMatch(/PDF/)
  expect(validatePdfFile({ name: 'a.pdf', size: 0, type: 'application/pdf' })).toMatch(/vazio/)
  expect(validatePdfFile({ name: 'a.pdf', size: MAX_PDF_BYTES, type: 'application/pdf' })).toBeNull()
  expect(validatePdfFile({ name: 'a.pdf', size: MAX_PDF_BYTES + 1, type: 'application/pdf' })).toMatch(/50 MB/)
})

test('caminho do arquivo fica na pasta do livro', () => {
  expect(bookFilePath('carnegie', 1730000000000)).toBe('carnegie/1730000000000.pdf')
})

test('link externo só http(s)', () => {
  expect(normalizeExternalUrl(' https://exemplo.com/livro ')).toBe('https://exemplo.com/livro')
  expect(normalizeExternalUrl('javascript:alert(1)')).toBeNull()
  expect(normalizeExternalUrl('exemplo.com')).toBeNull()
  expect(normalizeExternalUrl('')).toBeNull()
})

test('página de retomada nunca sai do intervalo do PDF (Review Focus 4)', () => {
  expect(clampPage(12, 200)).toBe(12)
  expect(clampPage(500, 200)).toBe(200)
  expect(clampPage(0, 200)).toBe(1)
  expect(clampPage(-3, null)).toBe(1)
  expect(clampPage(Number.NaN, 10)).toBe(1)
  expect(clampPage(7.9, null)).toBe(7)
})

test('rótulo de fase da biblioteca', () => {
  expect(phaseLabel('1')).toBe('Fase 1')
  expect(phaseLabel('2-3')).toBe('Fases 2 e 3')
  expect(phaseLabel('1-3')).toBe('Fases 1 a 3')
})
