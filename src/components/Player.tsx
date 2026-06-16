import { useEffect, useState } from 'react'
import type { Track } from '../data/tracks'

interface Props {
  track: Track | null
  isPlaying: boolean
  volume: number
  onTogglePlay: () => void
  onVolume: (v: number) => void
  onNext: () => void
  onPrev: () => void
}

function PlayPauseIcon({ playing, className }: { playing: boolean; className: string }) {
  return playing ? (
    <svg viewBox="0 0 24 24" className={className}>
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className={className}>
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

export default function Player({
  track,
  isPlaying,
  volume,
  onTogglePlay,
  onVolume,
  onNext,
  onPrev,
}: Props) {
  const [expanded, setExpanded] = useState(false)

  // Lock-screen / OS controls for the generative engine (Web Audio keeps
  // running in the background). App owns next/prev + metadata.
  useEffect(() => {
    if (!track || !('mediaSession' in navigator)) return
    const ms = navigator.mediaSession
    ms.setActionHandler('play', () => onTogglePlay())
    ms.setActionHandler('pause', () => onTogglePlay())
    return () => {
      ms.setActionHandler('play', null)
      ms.setActionHandler('pause', null)
    }
  }, [track, onTogglePlay])

  useEffect(() => {
    if (track && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
    }
  }, [track, isPlaying])

  if (!track) return null

  return (
    <>
      {/* ───────── mini bar ───────── */}
      <div className="fixed inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-4">
        <div className="glass mx-auto flex max-w-3xl items-center gap-3 rounded-2xl px-3 py-2.5 sm:gap-4 sm:px-4">
          {/* tap artwork + meta to expand */}
          <button
            onClick={() => setExpanded(true)}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
            aria-label="Open full player"
          >
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
          </button>

          <button
            onClick={onTogglePlay}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent text-ink shadow-[0_8px_22px_-10px_rgba(30,215,96,0.8)] transition hover:scale-105 active:scale-95"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <PlayPauseIcon playing={isPlaying} className="h-5 w-5 fill-current" />
          </button>

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

      {/* ───────── full-screen player ───────── */}
      {expanded && (
        <div className="fixed inset-0 z-50 flex flex-col bg-ink/95 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-2xl">
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
            <div className="flex items-center justify-between py-2">
              <button
                onClick={() => setExpanded(false)}
                className="grid h-10 w-10 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-text"
                aria-label="Minimize player"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d="M7 10l5 5 5-5z" />
                </svg>
              </button>
              <span className="text-xs font-semibold uppercase tracking-widest text-muted">
                Now Playing
              </span>
              <span className="h-10 w-10" />
            </div>

            {/* big artwork */}
            <div className="flex flex-1 items-center justify-center py-6">
              <div
                className={`relative grid aspect-square w-full max-w-sm place-items-center overflow-hidden rounded-[2rem] bg-gradient-to-br ${track.gradient} shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]`}
              >
                <span className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <span className="relative text-[7rem] drop-shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                  {track.glyph}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <p className="font-display text-2xl font-semibold">{track.title}</p>
              <p className="mt-1 text-sm text-muted">{track.subtitle}</p>
            </div>

            {/* transport */}
            <div className="mb-8 flex items-center justify-center gap-8">
              <button onClick={onPrev} className="text-text/90 transition hover:scale-110 active:scale-95" aria-label="Previous">
                <svg viewBox="0 0 24 24" className="h-9 w-9 fill-current">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>
              <button
                onClick={onTogglePlay}
                className="grid h-20 w-20 place-items-center rounded-full bg-accent text-ink shadow-[0_16px_40px_-12px_rgba(30,215,96,0.8)] transition hover:scale-105 active:scale-95"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                <PlayPauseIcon playing={isPlaying} className="h-9 w-9 fill-current" />
              </button>
              <button onClick={onNext} className="text-text/90 transition hover:scale-110 active:scale-95" aria-label="Next">
                <svg viewBox="0 0 24 24" className="h-9 w-9 fill-current">
                  <path d="M16 6h2v12h-2zM6 6l8.5 6L6 18z" />
                </svg>
              </button>
            </div>

            {/* volume */}
            <div className="mb-2 flex items-center gap-3">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-muted">
                <path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z" />
              </svg>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => onVolume(Number(e.target.value))}
                className="h-1 flex-1 cursor-pointer accent-accent"
                aria-label="Volume"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
