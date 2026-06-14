// Curated picks from the NeuroNest SoundHub (https://www.neuronesthub.org/soundhub),
// synced from the "Sound Hub Library" Notion DB. These are real tracks by independent
// creators — they play via embedded YouTube so every play is a genuine view that
// credits and supports the original artist. Full credit + channel links are shown.

export type CuratedCategory = 'Focus' | 'Calm' | 'Sleep'

export interface CuratedTrack {
  /** YouTube video id */
  id: string
  title: string
  artist: string
  category: CuratedCategory
  duration: string
}

export const CURATED: CuratedTrack[] = [
  {
    id: 'aju_UB5VIf8',
    title: '90 Minute Low Poly Ethereal Intelligent DnB',
    artist: 'Jungle Wizard',
    category: 'Focus',
    duration: '90 min',
  },
  {
    id: 'U5kH5VE31Rc',
    title: 'Stop Mind Wandering — Smoothed Brown Noise',
    artist: 'Jason Lewis',
    category: 'Focus',
    duration: '1 hr',
  },
  {
    id: 'NQk2mX5Z36k',
    title: 'Jazzhop Study Enhancer — Isochronic Tones',
    artist: 'Jason Lewis',
    category: 'Focus',
    duration: '1 hr',
  },
  {
    id: 'yLOM8R6lbzg',
    title: 'Studying White Noise — 10 Hours',
    artist: 'Relaxing White Noise',
    category: 'Focus',
    duration: '10 hr',
  },
  {
    id: 'woTWj6iN_aY',
    title: 'Calming Nervous System — Handpan Music',
    artist: 'Malte Marten',
    category: 'Calm',
    duration: '1 hr',
  },
  {
    id: 'v4C4keiF0tQ',
    title: 'Heavy Rain & Big Ocean Waves — White Noise',
    artist: 'Relaxing White Noise',
    category: 'Calm',
    duration: '10 hr',
  },
  {
    id: 'lh4JdZTJe7k',
    title: '12 Hours Relaxing Sleep Music',
    artist: 'Soothing Relaxation',
    category: 'Sleep',
    duration: '12 hr',
  },
]

export const SOUNDHUB_URL = 'https://www.neuronesthub.org/soundhub'

export const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
export const ytWatch = (id: string) => `https://www.youtube.com/watch?v=${id}`
export const ytEmbed = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`
