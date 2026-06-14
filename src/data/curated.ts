// Curated picks from the NeuroNest SoundHub — the full library, pulled from the
// "Sound Hub Library" Notion DB (collection://472ecc03-12c5-4331-b4bf-49a9de46b31c).
// Each is a real track by an independent creator; it plays via embedded YouTube so
// every play is a genuine view that credits and supports the original artist.

export type CuratedCategory = 'Focus' | 'Calm' | 'Sleep'

export interface CuratedTrack {
  /** YouTube video id */
  id: string
  title: string
  artist: string
  category: CuratedCategory
  duration: string
}

// Grouped Focus → Calm → Sleep so the "All" view reads cleanly.
export const CURATED: CuratedTrack[] = [
  // ── Focus ──────────────────────────────────────────────
  { id: 'UpPmnnJcy6A', title: '30 Min Focus — Dreamlight', artist: 'Brain.fm', category: 'Focus', duration: '30 min' },
  { id: 'L9iFUdkIkBE', title: '30 Min Intense Focus — Kyoto', artist: 'Brain.fm', category: 'Focus', duration: '30 min' },
  { id: 'bMEUAVOOAls', title: '30 Min Deep Focus — Casting Spells', artist: 'Brain.fm', category: 'Focus', duration: '30 min' },
  { id: 'A6dzSX62gEY', title: 'Clear Mind Intense Focus — Ambient Techno', artist: 'Jason Lewis', category: 'Focus', duration: '1 hr' },
  { id: 'NQk2mX5Z36k', title: 'Jazzhop Study Enhancer — Isochronic Tones', artist: 'Jason Lewis', category: 'Focus', duration: '1 hr' },
  { id: 'AKUIk1_Hqfk', title: 'Focus Flow — Deep Concentration House', artist: 'Jason Lewis', category: 'Focus', duration: '3 hr' },
  { id: '74cOUSKXMz0', title: '3-Hour Study With Me — Pomodoro 50/10', artist: 'Jason Sung', category: 'Focus', duration: '3 hr' },
  { id: 'U5kH5VE31Rc', title: 'Stop Mind Wandering — Brown Noise', artist: 'Jason Lewis', category: 'Focus', duration: '1 hr' },
  { id: 'rKxRHZec67M', title: 'Jazz Collection — Alpha/Beta Tones', artist: 'Jason Lewis', category: 'Focus', duration: '1 hr' },
  { id: 'aju_UB5VIf8', title: '90 Min Ethereal Intelligent DnB', artist: 'Jungle Wizard', category: 'Focus', duration: '90 min' },
  { id: 'yLOM8R6lbzg', title: 'Studying White Noise — 10 Hours', artist: 'Relaxing White Noise', category: 'Focus', duration: '10 hr' },
  { id: 'orhJUJuxDyo', title: 'Ambient Techno — Mix 075', artist: 'Rob Jenkins', category: 'Focus', duration: '1h 40m' },
  { id: '2F6B9EibJjw', title: 'Ambient Techno', artist: 'Ambient Techno Mixes', category: 'Focus', duration: '2 hr' },
  { id: 'bmvedkokyMc', title: 'LoFi Reggaeton Vibes', artist: 'LoFluent', category: 'Focus', duration: '3 hr' },
  { id: 'qlM39cB_5hk', title: 'Soft Dark Ambient — Beats to Code To', artist: 'lock in music', category: 'Focus', duration: '1 hr' },

  // ── Calm ───────────────────────────────────────────────
  { id: 'woTWj6iN_aY', title: 'Calming Your Nervous System — Handpan', artist: 'Malte Marten', category: 'Calm', duration: '1 hr' },
  { id: '--h6buReAvw', title: 'BEYOND — Meditation 444 Hz', artist: 'Zen Celesta', category: 'Calm', duration: '1 hr' },
  { id: 'qIW2Fu2SN0U', title: 'Engineered Pink Noise — Deep Sleep', artist: 'NeuroNest', category: 'Calm', duration: '12 hr' },
  { id: '-KAxNNhyfSY', title: 'Alpha Wave Promoting Soundscape', artist: 'Tranquility Studios', category: 'Calm', duration: '3 hr' },
  { id: 'v4C4keiF0tQ', title: 'Heavy Rain & Big Ocean Waves', artist: 'Relaxing White Noise', category: 'Calm', duration: '10 hr' },
  { id: 'PDI3mdiQuG0', title: 'Instant Stress Relief — Singing Bowls', artist: 'Aurabowls', category: 'Calm', duration: '1 hr' },

  // ── Sleep ──────────────────────────────────────────────
  { id: 'lh4JdZTJe7k', title: '12 Hours Relaxing Sleep Music', artist: 'Soothing Relaxation', category: 'Sleep', duration: '12 hr' },
  { id: '_SsYljnOsU8', title: 'Super Deep Brown Noise', artist: 'Something Soothing', category: 'Sleep', duration: '2 hr' },
  { id: 'FdN1pnEaJs0', title: 'Deep White Noise — Sleep All Night', artist: 'Relaxing White Noise', category: 'Sleep', duration: '10 hr' },
  { id: 'Yi7BM8XPTfA', title: 'Theta / Delta Waves Soundscape', artist: 'The Guided Meditation Site', category: 'Sleep', duration: '1 hr' },
]

export const SOUNDHUB_URL = 'https://www.neuronesthub.org/soundhub'

export const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
export const ytWatch = (id: string) => `https://www.youtube.com/watch?v=${id}`
export const ytEmbed = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`
