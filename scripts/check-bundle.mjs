// Orçamento de bundle (RNF-05: primeira carga < 3 s em 4G). Roda depois do `vite build`; sai com 1 se estourar.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const DIST = process.argv[2] ?? 'dist'
const INITIAL_GZ_BUDGET = 170_000 // JS da primeira carga (entrada + modulepreload), em gzip
const CHUNK_RAW_LIMIT = 500_000 // nenhum chunk .js acima do aviso do Vite; o worker do PDF.js (.mjs) só carrega no leitor

const html = readFileSync(join(DIST, 'index.html'), 'utf8')
const initial = [...html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.js)"/g)].map((m) => m[1])
const initialGz = initial.reduce((sum, f) => sum + gzipSync(readFileSync(join(DIST, f))).length, 0)
const big = readdirSync(join(DIST, 'assets'))
  .filter((f) => f.endsWith('.js'))
  .map((f) => [f, readFileSync(join(DIST, 'assets', f)).length])
  .filter(([, size]) => size > CHUNK_RAW_LIMIT)

const kb = (n) => `${(n / 1000).toFixed(1)} kB`
console.log(`JS da primeira carga (gzip): ${kb(initialGz)} de ${kb(INITIAL_GZ_BUDGET)} — ${initial.join(', ')}`)
for (const [f, size] of big) console.log(`Chunk grande demais: ${f} com ${kb(size)} (limite ${kb(CHUNK_RAW_LIMIT)})`)
if (initial.length === 0 || initialGz > INITIAL_GZ_BUDGET || big.length > 0) {
  console.error('Orçamento de bundle estourado.')
  process.exit(1)
}
console.log('Orçamento de bundle OK.')
