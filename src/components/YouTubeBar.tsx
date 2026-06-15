import { useEffect, useRef, useState } from 'react'
import { ytWatch, type CuratedTrack } from '../data/curated'

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
}

export default function YouTubeBar({ track, onClose }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const currentId = useRef(track.id)
  const [playing, setPlaying] = useState(false)
  const [ready, setReady] = useState(false)

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

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-4">
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

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{track.title}</p>
          <p className="truncate text-xs text-muted">
            {track.artist} · <span className="text-accent">YouTube</span>
          </p>
        </div>

        <a
          href={ytWatch(track.id)}
          target="_blank"
          rel="noopener noreferrer"
          title="Watch on YouTube"
          className="glass-soft hidden h-9 items-center rounded-full px-3 text-xs font-semibold text-muted transition hover:text-text sm:inline-flex"
        >
          Watch ↗
        </a>

        <button
          onClick={toggle}
          disabled={!ready}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent text-ink shadow-[0_8px_22px_-10px_rgba(30,215,96,0.8)] transition hover:scale-105 active:scale-95 disabled:opacity-50"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5 translate-x-[1px] fill-current">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
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
  )
}
