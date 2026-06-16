// Generates Neuronest favicon + PWA / Apple icons from the master logo.
// Single source of truth: public/icon-source.png (the forest-brain artwork).
// Drop a new square PNG in as icon-source.png and re-run: node scripts/gen-icons.mjs
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const source = join(pub, 'icon-source.png')

// Maskable/Apple icons want the art to bleed to the edges (the source already
// has its own rounded card + background), so we just downscale 1:1.
const sizes = [
  ['icon-512.png', 512],
  ['icon-192.png', 192],
  ['apple-touch-icon.png', 180],
  ['favicon-32.png', 32],
]

for (const [out, size] of sizes) {
  await sharp(source)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(join(pub, out))
  console.log('wrote', out, `${size}px`)
}
