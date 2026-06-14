// Generates Neuronest app icons + favicon from the head-and-brain logo.
// Single source of truth for the logo path data lives here and in src/components/Logo.tsx.
// Run: node scripts/gen-icons.mjs
import { Resvg } from '@resvg/resvg-js'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

// ── Logo geometry (64 viewBox, faces left) ─────────────────────────────
const HEAD =
  'M43.6 55 C44.6 47 47.6 43 47.6 34 C47.6 20.5 39 12.4 29.4 13.5 ' +
  'C22.8 14.2 18.9 19.5 18.4 25.6 C18.1 29.5 14.8 31 13.6 34 ' +
  'C16.2 36.5 18.4 37.6 18.2 40.5 C18 43.5 18.8 45.2 20.9 47.6 ' +
  'C21.3 49 21 50.5 20.8 52 L20.8 55'
const BRAIN =
  'M28.6 34.4 C24.6 34.8 22.2 30.8 24.6 28 C22.6 24.7 25.8 20.9 29.6 22.2 ' +
  'C30.7 18.9 36.3 18.8 37.7 22.3 C41.8 21.8 44 26.2 41 28.9 ' +
  'C43.1 31.7 40.1 35.4 36.2 34'
const STEM = 'M31 34 L31 45.6 M31 38.6 L34.4 35.4'

const paths = [HEAD, BRAIN, STEM]

const logoGroup = (stroke, width) =>
  `<g fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">` +
  paths.map((d) => `<path d="${d}"/>`).join('') +
  `</g>`

// Neon-green logo glowing on a black background (matches brand reference).
const iconSvg = (rx) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="65%">
      <stop offset="0" stop-color="#0c130c"/><stop offset="1" stop-color="#050705"/>
    </radialGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="1.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="64" height="64" rx="${rx}" fill="url(#bg)"/>
  <g transform="translate(32 32) scale(0.78) translate(-30.1 -33.7)" filter="url(#glow)">
    ${logoGroup('#1ed760', 3.0)}
  </g>
</svg>`

// Transparent mark, green strokes (general-purpose asset).
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 9.5 40 48" width="40" height="48">
  ${logoGroup('#1ed760', 3.2)}
</svg>`

function png(svg, size, out) {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: size } })
  writeFileSync(join(pub, out), r.render().asPng())
  console.log('wrote', out, `${size}px`)
}

png(iconSvg(0), 512, 'icon-512.png')
png(iconSvg(0), 192, 'icon-192.png')
png(iconSvg(0), 180, 'apple-touch-icon.png')
writeFileSync(join(pub, 'favicon.svg'), iconSvg(13))
writeFileSync(join(pub, 'logo.svg'), logoSvg)
console.log('wrote favicon.svg + logo.svg')
