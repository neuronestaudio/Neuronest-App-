import type { SoundOptions, SoundType } from '../audio/engine'

export type Category = 'Focus' | 'Calm' | 'Sleep' | 'Energy'

export interface Track {
  id: string
  title: string
  subtitle: string
  category: Category
  type: SoundType
  options?: SoundOptions
  /** tailwind gradient classes for the artwork */
  gradient: string
  glyph: string
}

export const CATEGORIES: Category[] = ['Focus', 'Calm', 'Sleep', 'Energy']

export const TRACKS: Track[] = [
  {
    id: 'deep-focus',
    title: 'Deep Focus',
    subtitle: 'Warm brown noise · masks distraction',
    category: 'Focus',
    type: 'brown',
    options: { cutoff: 2600 },
    gradient: 'from-indigo-500 to-violet-700',
    glyph: '🧠',
  },
  {
    id: 'flow-state',
    title: 'Flow State',
    subtitle: 'Alpha binaural · 10 Hz',
    category: 'Focus',
    type: 'binaural',
    options: { carrier: 210, beat: 10 },
    gradient: 'from-fuchsia-500 to-indigo-600',
    glyph: '🌊',
  },
  {
    id: 'gamma-boost',
    title: 'Gamma Boost',
    subtitle: 'Sharp recall · 40 Hz binaural',
    category: 'Energy',
    type: 'binaural',
    options: { carrier: 240, beat: 40 },
    gradient: 'from-amber-400 to-orange-600',
    glyph: '⚡',
  },
  {
    id: 'white-veil',
    title: 'White Veil',
    subtitle: 'Crisp white noise · open offices',
    category: 'Calm',
    type: 'white',
    options: { cutoff: 9000 },
    gradient: 'from-slate-300 to-slate-500',
    glyph: '🌫️',
  },
  {
    id: 'pink-haze',
    title: 'Pink Haze',
    subtitle: 'Balanced pink noise · soft edges',
    category: 'Calm',
    type: 'pink',
    options: { cutoff: 6000 },
    gradient: 'from-rose-400 to-pink-600',
    glyph: '🪷',
  },
  {
    id: 'rainfall',
    title: 'Rainfall',
    subtitle: 'Low-passed pink · gentle rain',
    category: 'Calm',
    type: 'pink',
    options: { cutoff: 1400 },
    gradient: 'from-cyan-400 to-teal-600',
    glyph: '🌧️',
  },
  {
    id: 'theta-drift',
    title: 'Theta Drift',
    subtitle: 'Deep relaxation · 6 Hz binaural',
    category: 'Sleep',
    type: 'binaural',
    options: { carrier: 160, beat: 6 },
    gradient: 'from-violet-600 to-indigo-900',
    glyph: '🌙',
  },
  {
    id: 'night-drone',
    title: 'Night Drone',
    subtitle: 'Ambient pad · drift to sleep',
    category: 'Sleep',
    type: 'drone',
    options: { carrier: 90, cutoff: 480 },
    gradient: 'from-blue-800 to-slate-900',
    glyph: '✨',
  },
]
