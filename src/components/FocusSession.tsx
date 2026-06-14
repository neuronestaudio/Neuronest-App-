import { FOCUS_PRESETS } from '../data/focusPresets'
import { useFocusSession, type FocusPhase } from '../hooks/useFocusSession'

interface Props {
  /** shared session instance (created once in App so it survives tab switches) */
  session: ReturnType<typeof useFocusSession>
  presetId: string
  setPresetId: (id: string) => void
  /** label of whatever soundscape is currently playing, if any */
  soundscapeLabel?: string | null
}

function fmt(total: number) {
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, '0')
  const s = (total % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// Read-only label for the current state pill.
const STATE_LABEL: Record<FocusPhase, string> = {
  idle: 'Ready',
  focusing: 'Focus',
  paused: 'Paused',
  break: 'Break',
  completed: 'Complete',
}

export default function FocusSession({ session, presetId, setPresetId, soundscapeLabel }: Props) {
  const s = session
  const preset = s.preset

  const onBreak = s.phase === 'break' || (s.phase === 'paused' && s.pausedFrom === 'break')
  const accent = onBreak || s.phase === 'completed' ? 'var(--color-accent)' : 'var(--color-focus)'

  // calm, human copy for every state
  const copy = (() => {
    switch (s.phase) {
      case 'idle':
        return s.round === 0
          ? { title: 'Settle in.', sub: 'Your focus session is ready.' }
          : { title: 'Ready for another round?', sub: 'Keep the momentum going.' }
      case 'focusing':
        return { title: 'Focus block in progress.', sub: `Round ${s.round}` }
      case 'paused':
        return s.pausedFrom === 'break'
          ? { title: 'Break paused.', sub: 'Resume when you’re ready.' }
          : { title: 'Paused.', sub: 'Resume when you’re ready.' }
      case 'break':
        return s.isLongBreak
          ? { title: 'Take a longer break.', sub: 'Step away — you’ve earned it.' }
          : { title: `Take ${preset.breakMinutes} minutes.`, sub: 'Let your brain reset.' }
      case 'completed':
        return { title: 'Session complete.', sub: 'Nice work.' }
    }
  })()

  const primaryLabel = {
    idle: s.round === 0 ? 'Start focus session' : 'Start next round',
    focusing: 'Pause',
    break: 'Pause',
    paused: 'Resume',
    completed: 'Start new session',
  }[s.phase]

  function onPrimary() {
    if (s.phase === 'idle' || s.phase === 'completed') s.start()
    else if (s.phase === 'paused') s.resume()
    else s.pause() // focusing | break
  }

  const showEnd = s.phase === 'focusing' || s.phase === 'paused' || s.phase === 'break'
  const showSkip = s.phase === 'break'

  // progress ring geometry
  const R = 52
  const C = 2 * Math.PI * R
  const progress = s.totalSeconds ? 1 - s.secondsLeft / s.totalSeconds : 0
  const setSize = preset.roundsBeforeLongBreak

  return (
    <div className="glass flex flex-col items-center rounded-3xl p-6">
      {/* state pill */}
      <div className="mb-5 flex w-full items-center justify-between">
        <span
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: accent, background: 'color-mix(in oklab, currentColor 14%, transparent)' }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
          {STATE_LABEL[s.phase]}
        </span>
        {s.round > 0 && (
          <span className="text-[11px] font-medium text-muted">Round {s.round}</span>
        )}
      </div>

      {/* timer ring */}
      <div className="relative grid place-items-center">
        <svg width="148" height="148" className="-rotate-90">
          <circle cx="74" cy="74" r={R} fill="none" stroke="var(--color-line)" strokeWidth="7" />
          <circle
            cx="74"
            cy="74"
            r={R}
            fill="none"
            stroke={accent}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 0.6s linear, stroke 0.4s ease' }}
          />
        </svg>
        <div className="absolute text-center">
          {s.phase === 'completed' ? (
            <span className="text-3xl" style={{ color: accent }}>
              ✓
            </span>
          ) : (
            <p className="font-mono text-[2rem] font-medium tabular-nums tracking-tight">
              {fmt(s.secondsLeft)}
            </p>
          )}
        </div>
      </div>

      {/* round dots — progress through the current set before a long break */}
      <div className="mt-4 flex gap-1.5">
        {Array.from({ length: setSize }).map((_, i) => {
          const filled = s.round === 0 ? 0 : ((s.round - 1) % setSize) + 1
          return (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full transition-colors"
              style={{ background: i < filled ? accent : 'var(--color-line)' }}
            />
          )
        })}
      </div>

      {/* copy */}
      <div className="mt-4 text-center">
        <p className="font-display text-base font-semibold">{copy.title}</p>
        <p className="mt-1 text-xs text-muted">{copy.sub}</p>
      </div>

      {/* soundscape label */}
      <p className="mt-3 max-w-[14rem] truncate text-center text-[11px] text-muted">
        {soundscapeLabel ? (
          <>
            <span style={{ color: accent }}>♪</span> {soundscapeLabel}
          </>
        ) : (
          'No soundscape — pick one to pair'
        )}
      </p>

      {/* preset picker — only before a session begins, keeps things low-friction */}
      {s.phase === 'idle' && s.round === 0 && (
        <div className="mt-5 flex gap-1.5">
          {FOCUS_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPresetId(p.id)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                p.id === presetId ? 'bg-text text-ink' : 'glass-soft text-muted hover:text-text'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* actions */}
      <button
        onClick={onPrimary}
        className="lift mt-6 w-full rounded-full py-3 text-sm font-semibold text-ink"
        style={{ background: accent }}
      >
        {primaryLabel}
      </button>

      {(showEnd || showSkip) && (
        <div className="mt-2.5 flex w-full gap-2">
          {showSkip && (
            <button
              onClick={s.skipBreak}
              className="glass-soft flex-1 rounded-full py-2.5 text-xs font-semibold text-muted transition hover:text-text"
            >
              Skip break
            </button>
          )}
          {showEnd && (
            <button
              onClick={s.end}
              className="glass-soft flex-1 rounded-full py-2.5 text-xs font-semibold text-muted transition hover:text-text"
            >
              End session
            </button>
          )}
        </div>
      )}
    </div>
  )
}
