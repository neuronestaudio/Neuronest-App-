import { useEffect, useRef, useState } from 'react'
import { engine } from './audio/engine'
import { TRACKS, type Track } from './data/tracks'
import Dashboard from './components/Dashboard'
import Player from './components/Player'
import FeedbackModal from './components/FeedbackModal'
import InsightsView from './components/InsightsView'
import { logPlay } from './feedback/store'

export default function App() {
  const [active, setActive] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.6)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [showInsights, setShowInsights] = useState(
    () => window.location.hash === '#insights',
  )
  const playedTracks = useRef<Set<string>>(new Set())

  useEffect(() => {
    engine.setVolume(volume)
  }, [volume])

  useEffect(() => {
    function onHash() {
      setShowInsights(window.location.hash === '#insights')
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  function startTrack(track: Track) {
    engine.play(track.type, track.options)
    setIsPlaying(true)
    if (!playedTracks.current.has(track.id)) {
      playedTracks.current.add(track.id)
      logPlay(track.id)
    }
  }

  function selectTrack(track: Track) {
    if (active?.id === track.id) {
      // toggle the currently-selected track
      if (isPlaying) {
        engine.stop()
        setIsPlaying(false)
      } else {
        startTrack(track)
      }
      return
    }
    setActive(track)
    startTrack(track)
  }

  function togglePlay() {
    if (!active) return
    if (isPlaying) {
      engine.stop()
      setIsPlaying(false)
    } else {
      startTrack(active)
    }
  }

  function closeInsights() {
    history.replaceState(null, '', window.location.pathname)
    setShowInsights(false)
  }

  if (showInsights) return <InsightsView onClose={closeInsights} />

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="app-aurora relative min-h-full">
      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-32 pt-6 sm:px-6 sm:pt-10">
        {/* header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-ink">
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path
                  d="M4 14h3l2 5 4-14 2 7h5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">Neuronest</span>
          </div>
          <span className="rounded-full border border-line px-3 py-1 text-[11px] font-medium text-muted">
            Prototype
          </span>
        </header>

        {/* hero */}
        <section className="mb-9">
          <p className="text-sm text-muted">{greeting}.</p>
          <h1 className="mt-1 max-w-xl font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Sound-engineered focus, on demand.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
            Pick a soundscape, start the timer, and drop into deep work. Every sound is generated
            live — no streaming, no buffering.
          </p>
          {!active && (
            <button
              onClick={() => selectTrack(TRACKS[0])}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:scale-[1.02]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 translate-x-[1px] fill-current">
                <path d="M8 5v14l11-7z" />
              </svg>
              Start a focus session
            </button>
          )}
        </section>

        <Dashboard activeId={active?.id ?? null} isPlaying={isPlaying} onToggle={selectTrack} />
      </div>

      {/* feedback launcher — always reachable, sits above the player bar */}
      <button
        onClick={() => setFeedbackOpen(true)}
        className={`fixed right-4 z-30 flex items-center gap-2 rounded-full border border-line bg-surface-2/90 px-4 py-2.5 text-sm font-semibold shadow-lg backdrop-blur transition hover:border-accent/50 hover:scale-[1.03] sm:right-6 ${
          active ? 'bottom-24' : 'bottom-5'
        }`}
      >
        <span>💬</span>
        <span className="hidden sm:inline">Shape the app</span>
        <span className="sm:hidden">Feedback</span>
      </button>

      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        playedTracks={[...playedTracks.current]}
      />

      <Player
        track={active}
        isPlaying={isPlaying}
        volume={volume}
        onTogglePlay={togglePlay}
        onVolume={setVolume}
      />
    </div>
  )
}
