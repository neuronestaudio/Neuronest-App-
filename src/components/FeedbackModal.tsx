import { useEffect, useState } from 'react'
import {
  FEEDBACK_TYPES,
  USE_CASES,
  saveFeedback,
  type FeedbackType,
  type UseCase,
} from '../feedback/store'
import { TRACKS } from '../data/tracks'

interface Props {
  open: boolean
  onClose: () => void
  /** tracks the user actually played this session */
  playedTracks: string[]
}

export default function FeedbackModal({ open, onClose, playedTracks }: Props) {
  const [type, setType] = useState<FeedbackType | null>(null)
  const [rating, setRating] = useState(0)
  const [useCase, setUseCase] = useState<UseCase | null>(null)
  const [context, setContext] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (open) {
      // reset on each open
      setType(null)
      setRating(0)
      setUseCase(null)
      setContext('')
      setMessage('')
      setEmail('')
      setDone(false)
      setSubmitting(false)
    }
  }, [open])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const canSubmit = !!type && message.trim().length > 1 && !submitting

  async function submit() {
    if (!type || !message.trim()) return
    setSubmitting(true)
    await saveFeedback({
      type,
      rating,
      useCase: useCase ?? undefined,
      context: context || undefined,
      message: message.trim(),
      email: email.trim() || undefined,
      topTracks: playedTracks,
    })
    setSubmitting(false)
    setDone(true)
  }

  const activeType = FEEDBACK_TYPES.find((t) => t.id === type)

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-line bg-surface p-6 scrollbar-none sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="py-10 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-2xl">
              💛
            </div>
            <h3 className="font-display text-xl font-semibold">Thank you — heard you.</h3>
            <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
              Every note shapes what Neuronest becomes next. Want to add another?
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setDone(false)}
                className="rounded-full border border-line px-5 py-2 text-sm font-semibold text-muted transition hover:text-text"
              >
                Add another
              </button>
              <button
                onClick={onClose}
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-ink transition hover:brightness-95"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-1 flex items-start justify-between">
              <div>
                <h3 className="font-display text-xl font-semibold">Shape the app</h3>
                <p className="mt-1 text-sm text-muted">
                  Tell us what to build next — it goes straight to the team.
                </p>
              </div>
              <button
                onClick={onClose}
                className="-mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-text"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* category */}
            <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-widest text-muted">
              What kind of note?
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FEEDBACK_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition ${
                    type === t.id
                      ? 'border-accent bg-accent/10'
                      : 'border-line hover:border-accent/40'
                  }`}
                >
                  <span className="text-lg">{t.glyph}</span>
                  <span className="text-xs font-semibold leading-tight">{t.label}</span>
                </button>
              ))}
            </div>

            {/* rating */}
            <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-widest text-muted">
              How focused did this help you feel?
            </p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n === rating ? 0 : n)}
                  className={`grid h-10 flex-1 place-items-center rounded-lg border text-lg transition ${
                    n <= rating
                      ? 'border-accent/60 bg-accent/15'
                      : 'border-line opacity-50 hover:opacity-100'
                  }`}
                  aria-label={`${n} out of 5`}
                >
                  {n <= rating ? '🧠' : '○'}
                </button>
              ))}
            </div>

            {/* use case */}
            <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-widest text-muted">
              What were you doing? <span className="font-normal normal-case">(optional)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {USE_CASES.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setUseCase(u.id === useCase ? null : u.id)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                    useCase === u.id
                      ? 'border-accent bg-accent/15 text-text'
                      : 'border-line text-muted hover:text-text'
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>

            {/* context — which track/area */}
            <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-widest text-muted">
              About which part? <span className="font-normal normal-case">(optional)</span>
            </p>
            <select
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full rounded-lg border border-line bg-ink/60 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
            >
              <option value="">The app overall</option>
              <optgroup label="Soundscapes">
                {TRACKS.map((t) => (
                  <option key={t.id} value={t.title}>
                    {t.title}
                  </option>
                ))}
              </optgroup>
              <option value="Pomodoro timer">Pomodoro timer</option>
              <option value="Player / controls">Player / controls</option>
            </select>

            {/* message */}
            <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-widest text-muted">
              {activeType ? activeType.hint : 'Your note'}
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder={
                type === 'sound_request'
                  ? 'e.g. ocean waves, café ambience, 432 Hz tones…'
                  : 'Be as specific as you like — detail helps us act on it.'
              }
              className="w-full resize-none rounded-lg border border-line bg-ink/60 px-3 py-2.5 text-sm text-text outline-none placeholder:text-muted/60 focus:border-accent"
            />

            {/* email */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (optional — if you want a reply)"
              className="mt-3 w-full rounded-lg border border-line bg-ink/60 px-3 py-2.5 text-sm text-text outline-none placeholder:text-muted/60 focus:border-accent"
            />

            <button
              onClick={submit}
              disabled={!canSubmit}
              className="mt-6 w-full rounded-full bg-white py-3 text-sm font-semibold text-ink transition enabled:hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? 'Sending…' : 'Send feedback'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
