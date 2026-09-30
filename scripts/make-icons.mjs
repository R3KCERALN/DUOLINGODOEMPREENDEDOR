// Ícones do PWA a partir da arte dither 1 bit (public/art/lobo3.png): recorte do rosto central sobre --color-bg,
// ampliado com vizinho mais próximo para o dither não borrar. Rode de novo só se a arte ou o recorte mudarem.
import { mkdirSync } from 'node:fs'
import sharp from 'sharp'

const SRC = 'public/art/lobo3.png'
const CROP = { left: 130, top: 38, width: 200, height: 200 } // rosto central; confira a saída a olho depois de mudar
const BG = '#0D100C' // --color-bg
const OUT = 'public/icons'

async function icon(file, size, pad) {
  const inner = Math.round(size * (1 - 2 * pad))
  const art = await sharp(SRC).extract(CROP).resize(inner, inner, { kernel: 'nearest' }).png().toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: art, gravity: 'center' }])
    .flatten({ background: BG })
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/${file}`)
  console.log(`${OUT}/${file} ${size}x${size}`)
}

mkdirSync(OUT, { recursive: true })
await icon('icon-192.png', 192, 0.04)
await icon('icon-512.png', 512, 0.04)
await icon('maskable-512.png', 512, 0.12) // área segura do maskable: o círculo central de 80%
await icon('apple-touch-icon.png', 180, 0.04) // iOS não aceita transparência: fundo chapado
await icon('favicon-32.png', 32, 0)
