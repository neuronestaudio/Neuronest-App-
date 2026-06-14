import type { Track } from '../data/tracks'

interface Props {
  track: Track
  isActive: boolean
  isPlaying: boolean
  onToggle: (track: Track) => void
}

export default function TrackCard({ track, isActive, isPlaying, onToggle }: Props) {
  const active = isActive && isPlaying
  return (
    <button
      onClick={() => onToggle(track)}
      className={`group relative flex w-full flex-col gap-3 rounded-2xl border p-3 text-left transition-all duration-200 ${
        isActive
          ? 'border-accent/60 bg-surface-2 shadow-[0_0_0_1px_rgba(124,124,255,0.25)]'
          : 'border-line bg-surface hover:border-accent/40 hover:bg-surface-2'
      }`}
    >
      <div
        className={`relative grid aspect-square place-items-center overflow-hidden rounded-xl bg-gradient-to-br ${track.gradient}`}
      >
        <span className="text-4xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">{track.glyph}</span>

        {/* play / pause overlay */}
        <span
          className={`absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-black/55 backdrop-blur transition-all ${
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {active ? (
            <span className="flex h-3.5 items-end gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="eq-bar w-0.5 rounded-full bg-white"
                  style={{ height: '100%', animationDelay: `${i * 0.18}s` }}
                />
              ))}
            </span>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4 translate-x-[1px] fill-white">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </span>
      </div>

      <div className="px-0.5 pb-1">
        <p className="truncate text-sm font-semibold text-text">{track.title}</p>
        <p className="truncate text-xs text-muted">{track.subtitle}</p>
      </div>
    </button>
  )
}
