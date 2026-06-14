// Neuronest head-and-brain mark. Path data mirrors scripts/gen-icons.mjs
// (which renders the favicon + PWA icons). Strokes use currentColor so it
// recolors to wherever it's placed.

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

export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="10 9.5 40 48"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={3.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Neuronest"
    >
      <path d={HEAD} />
      <path d={BRAIN} />
      <path d={STEM} />
    </svg>
  )
}
