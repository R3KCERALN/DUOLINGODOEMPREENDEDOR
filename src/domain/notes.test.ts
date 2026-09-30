import { noteLinkFromParams, noteLinkLabel, noteLinkPath, snippet } from './notes'

const p = (q: string) => new URLSearchParams(q)

test('vínculo vem dos parâmetros da rota', () => {
  expect(noteLinkFromParams(p('semana=w05'))).toEqual({ type: 'week', id: 'w05' })
  expect(noteLinkFromParams(p('livro=carnegie'))).toEqual({ type: 'book', id: 'carnegie' })
  expect(noteLinkFromParams(p('simulado=11111111-1111-1111-1111-111111111111'))).toMatchObject({ type: 'simulation' })
  expect(noteLinkFromParams(p('video=w01.video.1'))).toEqual({ type: 'video', id: 'w01.video.1' })
})

test('parâmetro inválido é ignorado (semana inexistente, id malformado)', () => {
  expect(noteLinkFromParams(p('semana=w99'))).toBeNull()
  expect(noteLinkFromParams(p('livro=../etc'))).toBeNull()
  expect(noteLinkFromParams(p('video=w01.reading'))).toBeNull()
  expect(noteLinkFromParams(p(''))).toBeNull()
})

test('rótulos e rotas do vínculo', () => {
  expect(noteLinkLabel({ type: 'week', id: 'w05' })).toBe('Semana 5')
  expect(noteLinkLabel({ type: 'book', id: 'carnegie' })).toBe('Livro')
  expect(noteLinkPath({ type: 'week', id: 'w05' })).toBe('/trilha/w05')
  expect(noteLinkPath({ type: 'book', id: 'carnegie' })).toBe('/biblioteca/carnegie')
})

test('resumo tira marcações e corta com reticências', () => {
  expect(snippet('# Título\n\n**forte** texto')).toBe('Título forte texto')
  expect(snippet('x'.repeat(200), 10)).toBe('xxxxxxxxxx…')
})
