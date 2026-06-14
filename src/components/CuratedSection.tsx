import { CURATED, SOUNDHUB_URL, ytThumb, type CuratedTrack } from '../data/curated'

interface Props {
  onPlay: (track: CuratedTrack) => void
  activeId: string | null
  filter: string
}

const catColor: Record<string, string> = {
  Focus: 'text-focus', // orange
  Calm: 'text-calm', // blue
  Sleep: 'text-sleep', // violet
}

export default function CuratedSection({ onPlay, activeId, filter }: Props) {
  const visible = filter === 'All' ? CURATED : CURATED.filter((t) => t.category === filter)

  // nothing curated in this category (e.g. Energy) — hide the section entirely
  if (visible.length === 0) return null

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
          className="glass-soft hidden shrink-0 rounded-full px-4 py-2 text-xs font-semibold text-muted transition hover:text-text sm:inline-block"
        >
          Full library ↗
        </a>
      </div>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:px-0">
        {visible.map((track) => (
          <button
            key={track.id}
            onClick={() => onPlay(track)}
            className={`group lift relative w-44 shrink-0 overflow-hidden rounded-3xl text-left ${
              activeId === track.id
                ? 'glass shadow-[0_0_0_1px_rgba(138,140,242,0.4)]'
                : 'glass-soft hover:border-accent/40'
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
