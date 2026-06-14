// Ambient environments roadmap — shown as "coming soon" in the Calm section.
// Each is a specific, buildable target. Flip `available` to true as they ship.

export interface Environment {
  id: string
  name: string
  description: string
  glyph: string
  gradient: string
  available: boolean
}

export const ENVIRONMENTS: Environment[] = [
  { id: 'rainforest', name: 'Rainforest Canopy', description: 'Dense jungle, distant birdsong, leaves dripping after rain.', glyph: '🌴', gradient: 'from-emerald-500 to-green-800', available: false },
  { id: 'ocean', name: 'Ocean Shore', description: 'Slow waves rolling onto a quiet beach at dawn.', glyph: '🌊', gradient: 'from-cyan-500 to-blue-800', available: false },
  { id: 'stream', name: 'Mountain Stream', description: 'Cold water over rocks with a soft alpine wind.', glyph: '🏞️', gradient: 'from-teal-400 to-cyan-700', available: false },
  { id: 'storm', name: 'Distant Thunderstorm', description: 'Rolling thunder and steady rain, far away.', glyph: '🌩️', gradient: 'from-slate-500 to-indigo-900', available: false },
  { id: 'fireside', name: 'Fireside Cabin', description: 'Crackling fire while snow taps the window.', glyph: '🔥', gradient: 'from-orange-500 to-rose-800', available: false },
  { id: 'cafe', name: 'Quiet Café', description: 'Low chatter, clinking cups, a hissing espresso machine.', glyph: '☕', gradient: 'from-amber-500 to-yellow-800', available: false },
  { id: 'meadow', name: 'Night Meadow', description: 'Crickets, a gentle breeze, a far-off owl.', glyph: '🦗', gradient: 'from-indigo-500 to-slate-900', available: false },
  { id: 'zen', name: 'Zen Garden', description: 'A bamboo fountain, raked gravel, complete stillness.', glyph: '🪷', gradient: 'from-pink-400 to-fuchsia-800', available: false },
  { id: 'snow', name: 'Snowfall', description: 'The muffled hush of snow falling on a still night.', glyph: '🌨️', gradient: 'from-sky-300 to-slate-600', available: false },
]
