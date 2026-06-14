import { CURATED, SOUNDHUB_URL, ytThumb, type CuratedTrack } from '../data/curated'

interface Props {
  onPlay: (track: CuratedTrack) => void
  activeId: string | null
}

const catColor: Record<string, string> = {
  Focus: 'text-accent',
  Calm: 'text-accent-2',
  Sleep: 'text-violet-300',
}

export default function CuratedSection({ onPlay, activeId }: Props) {
  return (
    <section className="mb-10">
      <div className="mb-1 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Curated from the SoundHub</h2>
          <p className="mt-1 max-w-md text-sm text-muted">
            Real tracks from independent creators — a taste of the wider library.
            <span className="text-text"> Every play supports the artist.</span>
          </p>
        </div>
        <a
          href={SOUNDHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden shrink-0 rounded-full border border-line px-4 py-2 text-xs font-semibold text-muted transition hover:border-accent/50 hover:text-text sm:inline-block"
        >
          Full library ↗
        </a>
      </div>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:px-0">
        {CURATED.map((track) => (
          <button
            key={track.id}
            onClick={() => onPlay(track)}
            className={`group relative w-44 shrink-0 overflow-hidden rounded-2xl border text-left transition ${
              activeId === track.id
                ? 'border-accent/70 bg-surface-2'
                : 'border-line bg-surface hover:border-accent/40'
            }`}
          >
            <div className="relative aspect-video overflow-hidden">
              <img
                src={ytThumb(track.id)}
                alt={track.title}
                loading="lazy"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">
                {track.duration}
              </span>
              <span className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white/95 opacity-0 transition group-hover:opacity-100">
                <svg viewBox="0 0 24 24" className="h-4 w-4 translate-x-[1px] fill-ink">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </div>
            <div className="p-3">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${catColor[track.category]}`}>
                {track.category}
              </p>
              <p className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-text">
                {track.title}
              </p>
              <p className="mt-1 truncate text-xs text-muted">{track.artist}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
