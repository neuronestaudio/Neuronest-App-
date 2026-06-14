import type { Track } from '../data/tracks'

interface Props {
  track: Track | null
  isPlaying: boolean
  volume: number
  onTogglePlay: () => void
  onVolume: (v: number) => void
}

export default function Player({ track, isPlaying, volume, onTogglePlay, onVolume }: Props) {
  if (!track) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-4">
      <div className="glass mx-auto flex max-w-3xl items-center gap-3 rounded-2xl px-3 py-2.5 sm:gap-4 sm:px-4">
        {/* artwork + meta */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={`relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br ${track.gradient} shadow-[0_6px_16px_-6px_rgba(0,0,0,0.6)]`}
          >
            {isPlaying && (
              <span
                className="absolute inset-0 rounded-xl border-2 border-white/40"
                style={{ animation: 'pulse-ring 1.8s ease-out infinite' }}
              />
            )}
            <span className="text-xl">{track.glyph}</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{track.title}</p>
            <p className="truncate text-xs text-muted">{track.subtitle}</p>
          </div>
        </div>

        {/* play / pause */}
        <button
          onClick={onTogglePlay}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-ink transition hover:scale-105"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5 translate-x-[1px] fill-current">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* volume — hidden on the smallest screens */}
        <div className="hidden items-center gap-2 sm:flex">
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-muted">
            <path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z" />
          </svg>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => onVolume(Number(e.target.value))}
            className="h-1 w-24 cursor-pointer accent-accent"
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  )
}
