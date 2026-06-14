import { useEffect, useRef, useState } from 'react'

type Mode = 'focus' | 'break'

const DURATIONS: Record<Mode, number> = {
  focus: 25 * 60,
  break: 5 * 60,
}

function fmt(total: number) {
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, '0')
  const s = (total % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function Pomodoro() {
  const [mode, setMode] = useState<Mode>('focus')
  const [remaining, setRemaining] = useState(DURATIONS.focus)
  const [running, setRunning] = useState(false)
  const [rounds, setRounds] = useState(0)
  const tick = useRef<number | null>(null)

  useEffect(() => {
    if (!running) return
    tick.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          // session complete — flip mode
          setRunning(false)
          setMode((m) => {
            const next: Mode = m === 'focus' ? 'break' : 'focus'
            if (m === 'focus') setRounds((n) => n + 1)
            setRemaining(DURATIONS[next])
            return next
          })
          try {
            // gentle chime
            const ctx = new AudioContext()
            const o = ctx.createOscillator()
            const g = ctx.createGain()
            o.frequency.value = 880
            o.connect(g)
            g.connect(ctx.destination)
            g.gain.setValueAtTime(0.001, ctx.currentTime)
            g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.05)
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2)
            o.start()
            o.stop(ctx.currentTime + 1.2)
          } catch {
            /* ignore */
          }
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => {
      if (tick.current) window.clearInterval(tick.current)
    }
  }, [running])

  const total = DURATIONS[mode]
  const progress = 1 - remaining / total
  const R = 52
  const C = 2 * Math.PI * R

  function switchMode(next: Mode) {
    setRunning(false)
    setMode(next)
    setRemaining(DURATIONS[next])
  }

  function reset() {
    setRunning(false)
    setRemaining(DURATIONS[mode])
  }

  return (
    <div className="flex flex-col items-center rounded-2xl border border-line bg-surface p-6">
      <div className="mb-5 flex gap-1 rounded-full border border-line bg-ink/60 p-1">
        {(['focus', 'break'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${
              mode === m ? 'bg-accent text-white' : 'text-muted hover:text-text'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="relative grid place-items-center">
        <svg width="140" height="140" className="-rotate-90">
          <circle cx="70" cy="70" r={R} fill="none" stroke="var(--color-line)" strokeWidth="8" />
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke={mode === 'focus' ? 'var(--color-accent)' : 'var(--color-accent-2)'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 0.5s linear' }}
          />
        </svg>
        <div className="absolute text-center">
          <p className="font-display text-3xl font-semibold tabular-nums tracking-tight">
            {fmt(remaining)}
          </p>
          <p className="mt-0.5 text-[11px] uppercase tracking-widest text-muted">
            {mode === 'focus' ? 'Deep work' : 'Recharge'}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className="rounded-full bg-accent px-7 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={reset}
          className="grid h-10 w-10 place-items-center rounded-full border border-line text-muted transition hover:text-text"
          aria-label="Reset timer"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z" />
          </svg>
        </button>
      </div>

      <p className="mt-4 text-xs text-muted">
        {rounds} {rounds === 1 ? 'session' : 'sessions'} completed today
      </p>
    </div>
  )
}
