import { useEffect } from 'react'
import { SOUNDHUB_URL, ytEmbed, ytWatch, type CuratedTrack } from '../data/curated'

interface Props {
  track: CuratedTrack | null
  onClose: () => void
}

export default function YouTubePlayer({ track, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (track) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [track, onClose])

  if (!track) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-t-3xl border border-line bg-surface sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* video */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            key={track.id}
            src={ytEmbed(track.id)}
            title={track.title}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* credit + links */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-accent">
                {track.category} · {track.duration}
              </p>
              <h3 className="mt-1 font-display text-base font-semibold leading-snug">
                {track.title}
              </h3>
              <p className="mt-1 text-sm text-muted">
                by <span className="font-semibold text-text">{track.artist}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-text"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <p className="mt-3 rounded-lg border border-line bg-ink/40 px-3 py-2 text-xs leading-relaxed text-muted">
            🎧 Playing the artist's original on YouTube — this play counts for{' '}
            <span className="text-text">{track.artist}</span>. Please support them directly.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={ytWatch(track.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:brightness-95"
            >
              Watch on YouTube ↗
            </a>
            <a
              href={SOUNDHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-muted transition hover:text-text"
            >
              Browse the full SoundHub ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
