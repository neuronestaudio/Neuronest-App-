import { useState } from 'react'
import { dayKey } from '../pomodoro/store'

interface Props {
  /** minutes focused per day, keyed YYYY-MM-DD */
  minutesByDay: Record<string, number>
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// 0 → no work, then warmer/greener as hours climb
function intensity(minutes: number): { bg: string; ring?: string } {
  const h = minutes / 60
  if (h <= 0) return { bg: 'var(--color-line)' }
  if (h < 0.5) return { bg: 'rgba(30,215,96,0.20)' }
  if (h < 1) return { bg: 'rgba(30,215,96,0.38)' }
  if (h < 2) return { bg: 'rgba(30,215,96,0.58)' }
  if (h < 4) return { bg: 'rgba(30,215,96,0.78)' }
  return { bg: 'rgba(30,215,96,1)' }
}

export default function Calendar({ minutesByDay }: Props) {
  const today = new Date()
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() })

  const first = new Date(view.year, view.month, 1)
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  // Monday-first leading blanks
  const lead = (first.getDay() + 6) % 7

  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const monthMinutes = Array.from({ length: daysInMonth }, (_, i) =>
    minutesByDay[dayKey(new Date(view.year, view.month, i + 1).getTime())] ?? 0,
  ).reduce((a, b) => a + b, 0)

  function shift(delta: number) {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  const todayKey = dayKey(today.getTime())

  return (
    <div className="glass rounded-3xl p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-semibold">
            {MONTHS[view.month]} {view.year}
          </h3>
          <p className="mt-0.5 text-xs text-muted">{(monthMinutes / 60).toFixed(1)}h focused this month</p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => shift(-1)}
            className="glass-soft grid h-8 w-8 place-items-center rounded-full text-muted transition hover:text-text active:scale-95"
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            onClick={() => shift(1)}
            className="glass-soft grid h-8 w-8 place-items-center rounded-full text-muted transition hover:text-text active:scale-95"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="pb-1 text-center text-[10px] font-semibold uppercase text-muted">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`b${i}`} />
          const key = dayKey(new Date(view.year, view.month, day).getTime())
          const mins = minutesByDay[key] ?? 0
          const { bg } = intensity(mins)
          const isToday = key === todayKey
          return (
            <div
              key={key}
              title={`${(mins / 60).toFixed(1)}h focused · ${key}`}
              className="relative grid aspect-square place-items-center rounded-lg text-[11px] font-medium transition"
              style={{
                background: bg,
                color: mins / 60 >= 1 ? '#06120a' : 'var(--color-muted)',
                outline: isToday ? '1.5px solid var(--color-focus)' : undefined,
                outlineOffset: '-1.5px',
              }}
            >
              {day}
            </div>
          )
        })}
      </div>

      {/* legend */}
      <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] text-muted">
        <span>Less</span>
        {[0, 0.4, 0.9, 1.9, 4].map((h, i) => (
          <span key={i} className="h-3 w-3 rounded" style={{ background: intensity(h * 60).bg }} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
