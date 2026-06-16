import type { Track } from '../data/tracks'

interface Props {
  track: Track
  isActive: boolean
  isPlaying: boolean
  onToggle: (track: Track) => void
}

// Compact Spotify-style list row — lets you scan a lot more tracks at once.
export default function TrackRow({ track, isActive, isPlaying, onToggle }: Props) {
  const playing = isActive && isPlaying
  return (
    <button
      onClick={() => onToggle(track)}
      className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition ${
        isActive ? 'glass' : 'hover:bg-surface-2'
      }`}
    >
      <div
        className={`relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-br ${track.gradient}`}
      >
        <span className="text-lg">{track.glyph}</span>
        {playing && (
          <span className="absolute inset-0 grid place-items-center bg-black/40">
            <span className="flex h-3.5 items-end gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="eq-bar w-0.5 rounded-full bg-white"
                  style={{ height: '100%', animationDelay: `${i * 0.18}s` }}
                />
              ))}
            </span>
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold ${isActive ? 'text-accent' : 'text-text'}`}>
          {track.title}
        </p>
        <p className="truncate text-xs text-muted">{track.subtitle}</p>
      </div>

      <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold text-muted">
        {track.category}
      </span>

      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted opacity-0 transition group-hover:opacity-100">
        {playing ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4 translate-x-[1px] fill-current">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </span>
    </button>
  )
}
