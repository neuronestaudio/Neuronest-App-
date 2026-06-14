// Pomodoro analytics store — records completed focus blocks and computes
// week/month/streak metrics for the Pomodoro tab.
//
// PRIVACY: this persists to localStorage for the MVP/demo only. localStorage is
// NOT a safe home for real PII (it's plaintext, per-device, readable by any script
// on the origin). Before storing real names/emails in production, move profile +
// history behind an authenticated backend with encryption-at-rest and explicit
// consent. The VITE_POMODORO_ENDPOINT seam below is where that backend plugs in.

export interface FocusBlock {
  id: string
  ts: number // completion time (ms epoch)
  minutes: number // focused minutes credited
  presetId: string
  completed: boolean // true = full block, false = ended early
}

export interface Profile {
  name?: string
  email?: string
  dailyGoalHours?: number
}

const BLOCKS_KEY = 'neuronest.pomodoro.v1'
const PROFILE_KEY = 'neuronest.profile.v1'
const ENDPOINT = import.meta.env.VITE_POMODORO_ENDPOINT as string | undefined
export const POMODORO_EVENT = 'neuronest:pomodoro-update'

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
    /* storage blocked — ignore */
  }
}

async function sendRemote(path: string, payload: unknown) {
  if (!ENDPOINT) return
  try {
    await fetch(`${ENDPOINT}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    /* offline — local copy still saved */
  }
}

/* ─────────────────────────── records ─────────────────────────── */

export function getBlocks(): FocusBlock[] {
  return read<FocusBlock[]>(BLOCKS_KEY, [])
}

export function logFocusBlock(input: { minutes: number; presetId: string; completed: boolean }) {
  if (input.minutes < 1) return // ignore negligible blocks
  const block: FocusBlock = {
    ...input,
    id: `fb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    ts: Date.now(),
  }
  const all = getBlocks()
  all.push(block)
  write(BLOCKS_KEY, all)
  void sendRemote('blocks', block)
  window.dispatchEvent(new CustomEvent(POMODORO_EVENT))
}

export function clearBlocks() {
  write(BLOCKS_KEY, [])
  window.dispatchEvent(new CustomEvent(POMODORO_EVENT))
}

/* ─────────────────────────── profile (PII) ─────────────────────────── */

export function getProfile(): Profile {
  return read<Profile>(PROFILE_KEY, {})
}
export function saveProfile(profile: Profile) {
  write(PROFILE_KEY, profile)
  void sendRemote('profile', profile)
  window.dispatchEvent(new CustomEvent(POMODORO_EVENT))
}

/* ─────────────────────────── aggregations ─────────────────────────── */

const pad = (n: number) => String(n).padStart(2, '0')

/** Local YYYY-MM-DD key for a timestamp. */
export function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function minutesByDay(blocks: FocusBlock[] = getBlocks()): Record<string, number> {
  const map: Record<string, number> = {}
  for (const b of blocks) {
    const k = dayKey(b.ts)
    map[k] = (map[k] ?? 0) + b.minutes
  }
  return map
}

/** Total minutes in the last `days` days (inclusive of today). */
export function minutesInLastDays(days: number, blocks: FocusBlock[] = getBlocks()): number {
  const cutoff = new Date()
  cutoff.setHours(0, 0, 0, 0)
  cutoff.setDate(cutoff.getDate() - (days - 1))
  const from = cutoff.getTime()
  return blocks.reduce((sum, b) => (b.ts >= from ? sum + b.minutes : sum), 0)
}

/** Total minutes in a given calendar month. */
export function minutesInMonth(year: number, month: number, blocks: FocusBlock[] = getBlocks()): number {
  return blocks.reduce((sum, b) => {
    const d = new Date(b.ts)
    return d.getFullYear() === year && d.getMonth() === month ? sum + b.minutes : sum
  }, 0)
}

/** Consecutive days (ending today, or yesterday if today is still empty) with focus time. */
export function currentStreak(map: Record<string, number> = minutesByDay()): number {
  const d = new Date()
  if (!(map[dayKey(d.getTime())] > 0)) d.setDate(d.getDate() - 1)
  let streak = 0
  while (map[dayKey(d.getTime())] > 0) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}
