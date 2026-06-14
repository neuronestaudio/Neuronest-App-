// Neuronest feedback system — the "Collect feedback" loop.
// Storage is isolated here so swapping localStorage for a real backend
// (Supabase / webhook / Notion proxy) is a one-file change. Set
// VITE_FEEDBACK_ENDPOINT to also POST every entry to a remote collector.

export type FeedbackType =
  | 'sound_request'
  | 'feature'
  | 'confusing'
  | 'loved'
  | 'bug'

export type UseCase = 'working' | 'studying' | 'relaxing' | 'sleeping' | 'other'

export interface FeedbackEntry {
  id: string
  createdAt: number
  /** 1–5; 0 means the reviewer didn't rate */
  rating: number
  type: FeedbackType
  useCase?: UseCase
  /** trackId or feature the note is about */
  context?: string
  message: string
  email?: string
  /** tracks actually played this session — implicit preference signal */
  topTracks?: string[]
}

export const FEEDBACK_TYPES: { id: FeedbackType; label: string; glyph: string; hint: string }[] = [
  { id: 'sound_request', label: 'Request a sound', glyph: '🎵', hint: 'What should we add?' },
  { id: 'feature', label: 'Feature idea', glyph: '✨', hint: 'Something the app should do' },
  { id: 'confusing', label: 'Confusing', glyph: '😕', hint: 'Where you got stuck' },
  { id: 'loved', label: 'Loved it', glyph: '💛', hint: 'What we should keep' },
  { id: 'bug', label: 'Something broke', glyph: '🐞', hint: 'What went wrong' },
]

export const USE_CASES: { id: UseCase; label: string }[] = [
  { id: 'working', label: 'Working' },
  { id: 'studying', label: 'Studying' },
  { id: 'relaxing', label: 'Relaxing' },
  { id: 'sleeping', label: 'Sleeping' },
  { id: 'other', label: 'Other' },
]

const FEEDBACK_KEY = 'neuronest.feedback.v1'
const PLAYS_KEY = 'neuronest.plays.v1'

const ENDPOINT = import.meta.env.VITE_FEEDBACK_ENDPOINT as string | undefined

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full / blocked — ignore */
  }
}

async function sendRemote(entry: FeedbackEntry) {
  if (!ENDPOINT) return
  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      // `Accept: application/json` makes Formspree (and most webhooks) respond
      // with JSON instead of a redirect, so the POST resolves cleanly.
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        ...entry,
        // human-readable fields so the email / webhook payload is scannable
        submittedAt: new Date(entry.createdAt).toISOString(),
        playedTracks: entry.topTracks?.join(', ') || '',
      }),
    })
  } catch {
    /* offline / blocked — the local copy is still saved */
  }
}

export function getFeedback(): FeedbackEntry[] {
  return read<FeedbackEntry[]>(FEEDBACK_KEY, []).sort((a, b) => b.createdAt - a.createdAt)
}

export async function saveFeedback(
  input: Omit<FeedbackEntry, 'id' | 'createdAt'>,
): Promise<FeedbackEntry> {
  const entry: FeedbackEntry = {
    ...input,
    id: `fb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  }
  const all = read<FeedbackEntry[]>(FEEDBACK_KEY, [])
  all.push(entry)
  write(FEEDBACK_KEY, all)
  void sendRemote(entry)
  return entry
}

export function clearFeedback() {
  write(FEEDBACK_KEY, [])
}

/* ---- implicit signal: how often each track is played ---- */

export function logPlay(trackId: string) {
  const counts = read<Record<string, number>>(PLAYS_KEY, {})
  counts[trackId] = (counts[trackId] ?? 0) + 1
  write(PLAYS_KEY, counts)
}

export function getPlayCounts(): Record<string, number> {
  return read<Record<string, number>>(PLAYS_KEY, {})
}
