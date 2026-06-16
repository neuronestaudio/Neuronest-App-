import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ytThumb, ytWatch, type CuratedTrack } from '../data/curated'
import { categoryColor } from '../data/tracks'

// Official YouTube IFrame Player API — the supported, reliable way to embed and
// control YouTube playback (vs. a raw autoplay iframe, which is flaky and often
// blocked). The player stays visible (small) to comply with YouTube's Terms.
type YTPlayer = {
  playVideo: () => void
  pauseVideo: () => void
  loadVideoById: (id: string) => void
  destroy: () => void
}
declare global {
  interface Window {
    YT?: {
      Player: new (el: HTMLElement, opts: unknown) => YTPlayer
      PlayerState: { PLAYING: number }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiPromise: Promise<void> | null = null
function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve()
  if (apiPromise) return apiPromise
  apiPromise = new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve()
    }
    const s = document.createElement('script')
    s.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(s)
  })
  return apiPromise
}

interface Props {
  track: CuratedTrack
  onClose: () => void
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

export default function YouTubeBar({ track, onClose, onNext, onPrev }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const currentId = useRef(track.id)
  const [playing, setPlaying] = useState(false)
  const [ready, setReady] = useState(false)
  const [expanded, setExpanded] = useState(false)

  // Create the player once when the bar appears. The click that opened it is a
  // user gesture, so autoplay-with-sound is permitted.
  useEffect(() => {
    let cancelled = false
    loadYouTubeApi().then(() => {
      if (cancelled || !hostRef.current || !window.YT) return
      playerRef.current = new window.YT.Player(hostRef.current, {
        videoId: track.id,
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            setReady(true)
            e.target.playVideo()
          },
          onStateChange: (e: { data: number }) => {
            if (window.YT) setPlaying(e.data === window.YT.PlayerState.PLAYING)
          },
        },
      })
    })
    return () => {
      cancelled = true
      playerRef.current?.destroy()
      playerRef.current = null
    }
    // create once — track changes are handled by the effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Swap the video in place when a different curated track is chosen.
  useEffect(() => {
    if (ready && track.id !== currentId.current) {
      currentId.current = track.id
      playerRef.current?.loadVideoById(track.id)
    }
  }, [track.id, ready])

  function toggle() {
    const p = playerRef.current
    if (!p) return
    if (playing) p.pauseVideo()
    else p.playVideo()
  }

  // Lock-screen / OS play-pause control for the curated track.
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.setActionHandler('play', () => playerRef.current?.playVideo())
    navigator.mediaSession.setActionHandler('pause', () => playerRef.current?.pauseVideo())
    return () => {
      navigator.mediaSession.setActionHandler('play', null)
      navigator.mediaSession.setActionHandler('pause', null)
    }
  }, [])

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
    }
  }, [playing])

  // player accent always follows the playing track's own category colour
  const accent = { '--state': categoryColor(track.category) } as CSSProperties

  return (
    <>
      {/* ───────── mini bar (hosts the live iframe) ───────── */}
      <div
        className="fixed inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-4"
        style={accent}
      >
        <div className="glass mx-auto flex max-w-3xl items-center gap-3 rounded-2xl p-2.5 sm:gap-4 sm:p-3">
          {/* small visible player (YouTube ToS) */}
          <div className="yt-slot relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-black sm:h-[54px] sm:w-24">
            <div ref={hostRef} />
            {!ready && (
              <span className="absolute inset-0 grid place-items-center text-[10px] text-white/60">
                loading…
              </span>
            )}
          </div>

          <button
            onClick={() => setExpanded(true)}
            className="min-w-0 flex-1 text-left"
            aria-label="Open full player"
          >
            <p className="truncate text-sm font-semibold">{track.title}</p>
            <p className="truncate text-xs text-muted">
              {track.artist} · <span className="text-accent">YouTube</span>
            </p>
          </button>

          <button
            onClick={toggle}
            disabled={!ready}
            className="accent-fill accent-glow grid h-12 w-12 shrink-0 place-items-center rounded-full transition hover:scale-105 active:scale-95 disabled:opacity-50"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            <PlayPauseIcon playing={playing} className="h-5 w-5 fill-current" />
          </button>

          <button
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-text"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ───────── full-screen player ───────── */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-ink/95 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-2xl"
          style={accent}
        >
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
              <a
                href={ytWatch(track.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-10 w-10 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-text"
                aria-label="Watch on YouTube"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3zM5 5h6V3H3v8h2z" />
                </svg>
              </a>
            </div>

            {/* big album art (YouTube thumbnail) */}
            <div className="flex flex-1 items-center justify-center py-6">
              <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-[2rem] bg-black shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]">
                <img src={ytThumb(track.id)} alt={track.title} className="h-full w-full object-cover" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            </div>

            <div className="mb-6">
              <p className="font-display text-2xl font-semibold">{track.title}</p>
              <p className="mt-1 text-sm text-muted">
                {track.artist} · <span className="text-accent">YouTube</span>
              </p>
            </div>

            {/* transport */}
            <div className="mb-10 flex items-center justify-center gap-8">
              <button onClick={onPrev} className="text-text/90 transition hover:scale-110 active:scale-95" aria-label="Previous">
                <svg viewBox="0 0 24 24" className="h-9 w-9 fill-current">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>
              <button
                onClick={toggle}
                disabled={!ready}
                className="accent-fill accent-glow-lg grid h-20 w-20 place-items-center rounded-full transition hover:scale-105 active:scale-95 disabled:opacity-50"
                aria-label={playing ? 'Pause' : 'Play'}
              >
                <PlayPauseIcon playing={playing} className="h-9 w-9 fill-current" />
              </button>
              <button onClick={onNext} className="text-text/90 transition hover:scale-110 active:scale-95" aria-label="Next">
                <svg viewBox="0 0 24 24" className="h-9 w-9 fill-current">
                  <path d="M16 6h2v12h-2zM6 6l8.5 6L6 18z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
