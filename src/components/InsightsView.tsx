import { useMemo } from 'react'
import {
  FEEDBACK_TYPES,
  clearFeedback,
  getFeedback,
  getPlayCounts,
  type FeedbackType,
} from '../feedback/store'
import { TRACKS } from '../data/tracks'

interface Props {
  onClose: () => void
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function InsightsView({ onClose }: Props) {
  const feedback = getFeedback()
  const plays = getPlayCounts()

  const stats = useMemo(() => {
    const rated = feedback.filter((f) => f.rating > 0)
    const avg = rated.length
      ? rated.reduce((s, f) => s + f.rating, 0) / rated.length
      : 0

    const byType: Record<FeedbackType, number> = {
      sound_request: 0,
      feature: 0,
      confusing: 0,
      loved: 0,
      bug: 0,
    }
    feedback.forEach((f) => {
      byType[f.type] = (byType[f.type] ?? 0) + 1
    })

    const topTracks = TRACKS.map((t) => ({ track: t, count: plays[t.id] ?? 0 }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    const maxPlay = topTracks[0]?.count ?? 1

    return { avg, byType, topTracks, maxPlay, total: feedback.length, rated: rated.length }
  }, [feedback, plays])

  function exportJson() {
    const blob = new Blob([JSON.stringify(feedback, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'neuronest-feedback.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const maxTypeCount = Math.max(1, ...Object.values(stats.byType))

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink scrollbar-none">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              Internal · Insights
            </p>
            <h1 className="font-display text-2xl font-semibold">What people want</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportJson}
              className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-muted transition hover:text-text"
            >
              Export JSON
            </button>
            <button
              onClick={onClose}
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink"
            >
              Back to app
            </button>
          </div>
        </header>

        {/* summary cards */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Responses" value={String(stats.total)} />
          <Stat label="Avg focus" value={stats.avg ? `${stats.avg.toFixed(1)}/5` : '—'} />
          <Stat
            label="Sound requests"
            value={String(stats.byType.sound_request)}
            accent
          />
          <Stat label="Bugs" value={String(stats.byType.bug)} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* feedback by type */}
          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="mb-4 font-display text-sm font-semibold">Feedback by type</h2>
            <div className="space-y-3">
              {FEEDBACK_TYPES.map((t) => {
                const count = stats.byType[t.id]
                return (
                  <div key={t.id}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>
                        {t.glyph} {t.label}
                      </span>
                      <span className="text-muted">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2"
                        style={{ width: `${(count / maxTypeCount) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* most played — behavioral signal */}
          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="mb-1 font-display text-sm font-semibold">Most played</h2>
            <p className="mb-4 text-xs text-muted">What people reach for — even without a review.</p>
            {stats.topTracks.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted">No plays logged yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.topTracks.map(({ track, count }) => (
                  <div key={track.id}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>
                        {track.glyph} {track.title}
                      </span>
                      <span className="text-muted">{count} plays</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-line">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${track.gradient}`}
                        style={{ width: `${(count / stats.maxPlay) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* raw feed */}
        <section className="mt-6 rounded-2xl border border-line bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold">Recent reviews</h2>
            {feedback.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Clear all locally stored feedback?')) {
                    clearFeedback()
                    onClose()
                  }
                }}
                className="text-xs text-muted transition hover:text-rose-400"
              >
                Clear all
              </button>
            )}
          </div>

          {feedback.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">
              No feedback yet. Submit one from the app to see it appear here.
            </p>
          ) : (
            <ul className="space-y-3">
              {feedback.map((f) => {
                const meta = FEEDBACK_TYPES.find((t) => t.id === f.type)
                return (
                  <li key={f.id} className="rounded-xl border border-line bg-ink/40 p-4">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-surface-2 px-2.5 py-1 font-semibold">
                        {meta?.glyph} {meta?.label}
                      </span>
                      {f.rating > 0 && (
                        <span className="text-muted">{'🧠'.repeat(f.rating)}</span>
                      )}
                      {f.context && <span className="text-muted">· {f.context}</span>}
                      {f.useCase && <span className="text-muted">· {f.useCase}</span>}
                      <span className="ml-auto text-muted">{timeAgo(f.createdAt)}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-text">{f.message}</p>
                    {f.email && <p className="mt-1.5 text-xs text-accent">{f.email}</p>}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <p className="mt-6 text-center text-xs text-muted">
          Showing locally stored feedback on this device. Connect a backend to pool responses from
          every visitor.
        </p>
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        accent ? 'border-accent/40 bg-accent/10' : 'border-line bg-surface'
      }`}
    >
      <p className="font-display text-2xl font-semibold">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  )
}
