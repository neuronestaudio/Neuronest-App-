import { useEffect, useState } from 'react'
import { FOCUS_PRESETS } from '../data/focusPresets'
import { useFocusSession } from '../hooks/useFocusSession'
import {
  POMODORO_EVENT,
  currentStreak,
  dayKey,
  getBlocks,
  getProfile,
  minutesByDay,
  minutesInLastDays,
  minutesInMonth,
  saveProfile,
  type Profile,
} from '../pomodoro/store'
import FocusSession from './FocusSession'
import Calendar from './Calendar'

interface Props {
  session: ReturnType<typeof useFocusSession>
  presetId: string
  setPresetId: (id: string) => void
  soundscapeLabel: string | null
}

const presetName = (id: string) => FOCUS_PRESETS.find((p) => p.id === id)?.name ?? id

function fmtH(minutes: number) {
  if (minutes < 60) return `${minutes}m`
  return `${(minutes / 60).toFixed(1)}h`
}
function timeAgo(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function PomodoroApp({ session, presetId, setPresetId, soundscapeLabel }: Props) {
  // re-read store whenever a block/profile is logged (or the session phase changes)
  const [, tick] = useState(0)
  useEffect(() => {
    const h = () => tick((n) => n + 1)
    window.addEventListener(POMODORO_EVENT, h)
    return () => window.removeEventListener(POMODORO_EVENT, h)
  }, [])

  const blocks = getBlocks()
  const byDay = minutesByDay(blocks)
  const now = new Date()
  const weekMin = minutesInLastDays(7, blocks)
  const monthMin = minutesInMonth(now.getFullYear(), now.getMonth(), blocks)
  const streak = currentStreak(byDay)
  const todayMin = byDay[dayKey(now.getTime())] ?? 0

  const [profile, setProfile] = useState<Profile>(() => getProfile())
  const goalHours = profile.dailyGoalHours ?? 2
  const goalPct = Math.min(100, (todayMin / 60 / goalHours) * 100)

  // last 7 days for the bar chart
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const mins = byDay[dayKey(d.getTime())] ?? 0
    return { label: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][(d.getDay() + 6) % 7], mins, isToday: i === 6 }
  })
  const weekMax = Math.max(60, goalHours * 60, ...week.map((d) => d.mins))

  const recent = [...blocks].reverse().slice(0, 6)

  return (
    <main className="relative z-10 mx-auto max-w-6xl px-4 pb-36 pt-8 sm:px-6 sm:pt-12">
      <section className="rise mb-8">
        <p className="text-sm font-medium text-muted">Pomodoro</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
          Your focus, measured.
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted">
          Every focus block you complete is logged here — see the hours add up across the week and month.
        </p>
      </section>

      {/* metric cards */}
      <div className="rise mb-7 grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ animationDelay: '0.05s' }}>
        <Metric label="This week" value={fmtH(weekMin)} accent />
        <Metric label="This month" value={fmtH(monthMin)} />
        <Metric label="Day streak" value={`${streak}`} suffix={streak === 1 ? 'day' : 'days'} />
        <Metric label="Sessions" value={`${blocks.length}`} />
      </div>

      <div className="rise grid gap-6 lg:grid-cols-[340px_1fr]" style={{ animationDelay: '0.1s' }}>
        {/* timer */}
        <FocusSession
          session={session}
          presetId={presetId}
          setPresetId={setPresetId}
          soundscapeLabel={soundscapeLabel}
        />

        {/* week chart + today goal */}
        <div className="flex flex-col gap-6">
          <div className="glass rounded-3xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold">Last 7 days</h3>
              <span className="text-xs text-muted">{fmtH(weekMin)} total</span>
            </div>
            <div className="flex items-end justify-between gap-2" style={{ height: 140 }}>
              {week.map((d, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{
                        height: `${Math.max(4, (d.mins / weekMax) * 100)}%`,
                        background: d.isToday ? 'var(--color-focus)' : 'var(--color-accent)',
                        opacity: d.mins === 0 ? 0.18 : 1,
                      }}
                      title={`${fmtH(d.mins)}`}
                    />
                  </div>
                  <span className={`text-[11px] ${d.isToday ? 'text-text' : 'text-muted'}`}>{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="font-display text-base font-semibold">Today</h3>
              <span className="text-xs text-muted">
                {(todayMin / 60).toFixed(1)}h / {goalHours}h goal
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${goalPct}%`, background: 'var(--color-focus)' }}
              />
            </div>
            <p className="mt-2 text-xs text-muted">
              {goalPct >= 100 ? 'Goal reached — nice work.' : 'Keep going. Every block counts.'}
            </p>
          </div>
        </div>
      </div>

      {/* calendar */}
      <div className="rise mt-6" style={{ animationDelay: '0.15s' }}>
        <Calendar minutesByDay={byDay} />
      </div>

      {/* recent + profile */}
      <div className="rise mt-6 grid gap-6 lg:grid-cols-2" style={{ animationDelay: '0.2s' }}>
        <div className="glass rounded-3xl p-6">
          <h3 className="mb-4 font-display text-base font-semibold">Recent sessions</h3>
          {recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              No sessions yet. Start a focus block to see it here.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {recent.map((b) => (
                <li key={b.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2.5">
                    <span
                      className="grid h-8 w-8 place-items-center rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(255,139,61,0.15)', color: 'var(--color-focus)' }}
                    >
                      {b.minutes}m
                    </span>
                    <span>
                      <span className="font-medium">{presetName(b.presetId)}</span>
                      {!b.completed && <span className="ml-2 text-xs text-muted">ended early</span>}
                    </span>
                  </span>
                  <span className="text-xs text-muted">{timeAgo(b.ts)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ProfileCard profile={profile} onSave={(p) => { saveProfile(p); setProfile(p) }} />
      </div>
    </main>
  )
}

function Metric({ label, value, suffix, accent }: { label: string; value: string; suffix?: string; accent?: boolean }) {
  return (
    <div className={`glass rounded-2xl p-4 ${accent ? 'shadow-[0_0_0_1px_rgba(30,215,96,0.25)]' : ''}`}>
      <p className="font-display text-2xl font-semibold" style={accent ? { color: 'var(--color-accent)' } : undefined}>
        {value} {suffix && <span className="text-sm font-medium text-muted">{suffix}</span>}
      </p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  )
}

function ProfileCard({ profile, onSave }: { profile: Profile; onSave: (p: Profile) => void }) {
  const [name, setName] = useState(profile.name ?? '')
  const [email, setEmail] = useState(profile.email ?? '')
  const [goal, setGoal] = useState(String(profile.dailyGoalHours ?? 2))
  const [saved, setSaved] = useState(false)

  function save() {
    onSave({ name: name.trim() || undefined, email: email.trim() || undefined, dailyGoalHours: Number(goal) || 2 })
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="glass rounded-3xl p-6">
      <h3 className="font-display text-base font-semibold">Your profile</h3>
      <p className="mt-1 text-xs text-muted">Personalise your goals and keep your stats with you.</p>

      <div className="mt-4 space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full rounded-lg border border-line bg-ink/50 px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-line bg-ink/50 px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
        <label className="flex items-center justify-between rounded-lg border border-line bg-ink/50 px-3 py-2.5 text-sm">
          <span className="text-muted">Daily goal (hours)</span>
          <input
            type="number"
            min={0.5}
            max={16}
            step={0.5}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-16 bg-transparent text-right outline-none"
          />
        </label>
      </div>

      <button
        onClick={save}
        className="lift mt-4 w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-ink"
      >
        {saved ? 'Saved' : 'Save profile'}
      </button>

      <p className="mt-3 text-[11px] leading-relaxed text-muted">
        🔒 Stored only on this device for the demo. A production build would keep this behind a
        secure, consented account — never plain local storage.
      </p>
    </div>
  )
}
