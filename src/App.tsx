import { useEffect, useRef, useState } from 'react'
import { engine } from './audio/engine'
import { TRACKS, type Track } from './data/tracks'
import { FOCUS_PRESETS } from './data/focusPresets'
import { useFocusSession } from './hooks/useFocusSession'
import Dashboard from './components/Dashboard'
import Player from './components/Player'
import FeedbackModal from './components/FeedbackModal'
import InsightsView from './components/InsightsView'
import CuratedSection from './components/CuratedSection'
import CalmEnvironments from './components/CalmEnvironments'
import YouTubePlayer from './components/YouTubePlayer'
import PomodoroApp from './components/PomodoroApp'
import Logo from './components/Logo'
import type { CuratedTrack } from './data/curated'
import { logPlay } from './feedback/store'

type Route = 'home' | 'pomodoro' | 'insights'

function routeFromHash(): Route {
  const h = window.location.hash
  if (h === '#pomodoro') return 'pomodoro'
  if (h === '#insights') return 'insights'
  return 'home'
}

export default function App() {
  const [active, setActive] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.6)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [curatedTrack, setCuratedTrack] = useState<CuratedTrack | null>(null)
  const [filter, setFilter] = useState<string>('All')
  const [route, setRoute] = useState<Route>(routeFromHash)
  const playedTracks = useRef<Set<string>>(new Set())

  // One Focus Session instance, shared across the Home + Pomodoro tabs.
  const [presetId, setPresetId] = useState(FOCUS_PRESETS[0].id)
  const preset = FOCUS_PRESETS.find((p) => p.id === presetId) ?? FOCUS_PRESETS[0]
  const session = useFocusSession(preset)

  useEffect(() => {
    engine.setVolume(volume)
  }, [volume])

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  function go(r: Route) {
    history.replaceState(null, '', window.location.pathname + (r === 'home' ? '' : `#${r}`))
    setRoute(r)
  }

  function startTrack(track: Track) {
    setCuratedTrack(null) // stop any curated YouTube track first
    engine.play(track.type, track.options)
    setIsPlaying(true)
    if (!playedTracks.current.has(track.id)) {
      playedTracks.current.add(track.id)
      logPlay(track.id)
    }
  }

  function openCurated(track: CuratedTrack) {
    engine.stop() // generative + curated audio are mutually exclusive
    setIsPlaying(false)
    setCuratedTrack(track)
  }

  function selectTrack(track: Track) {
    if (active?.id === track.id) {
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

  if (route === 'insights') return <InsightsView onClose={() => go('home')} />

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const soundscapeLabel = curatedTrack?.title ?? active?.title ?? null

  const tab = (r: Route, label: string) => (
    <button
      onClick={() => go(r)}
      className={`relative rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
        route === r ? 'bg-text text-ink' : 'text-muted hover:text-text'
      }`}
    >
      {label}
      {r === 'pomodoro' && session.phase === 'focusing' && route !== 'pomodoro' && (
        <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-focus" />
      )}
    </button>
  )

  return (
    <div className="app-aurora relative min-h-full">
      <div className="grain" aria-hidden="true" />

      {/* sticky glass header */}
      <header className="sticky top-0 z-30 px-3 pt-3 sm:px-5 sm:pt-4">
        <div className="glass mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-2xl px-3 py-2 sm:px-5">
          <button onClick={() => go('home')} className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-accent ring-1 ring-accent/25 shadow-[0_0_18px_-4px_rgba(30,215,96,0.55)]">
              <Logo className="h-6 w-6 drop-shadow-[0_0_4px_rgba(30,215,96,0.6)]" />
            </div>
            <span className="hidden font-display text-lg font-semibold tracking-tight sm:inline">
              Neuronest
            </span>
          </button>

          <nav className="glass-soft flex items-center gap-1 rounded-full p-1">
            {tab('home', 'Home')}
            {tab('pomodoro', 'Pomodoro')}
          </nav>

          <span className="hidden rounded-full px-3 py-1 text-[11px] font-medium text-muted sm:inline-block">
            Prototype
          </span>
        </div>
      </header>

      {route === 'pomodoro' ? (
        <PomodoroApp
          session={session}
          presetId={presetId}
          setPresetId={setPresetId}
          soundscapeLabel={soundscapeLabel}
        />
      ) : (
        <main className="relative z-10 mx-auto max-w-6xl px-4 pb-36 pt-8 sm:px-6 sm:pt-12">
          {/* hero */}
          <section className="rise mb-12">
            <p className="text-sm font-medium text-muted">{greeting}.</p>
            <h1 className="mt-2 max-w-2xl text-balance font-display text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.03em] sm:text-6xl">
              Sound-engineered focus,{' '}
              <span className="bg-gradient-to-r from-accent via-accent to-accent-2 bg-clip-text text-transparent">
                on demand.
              </span>
            </h1>
            <p className="mt-5 max-w-md text-pretty text-[15px] leading-relaxed text-muted">
              Pick a soundscape, start the timer, and drop into deep work. Every sound is generated
              live on your device — no streaming, no buffering.
            </p>
            {!active && (
              <button
                onClick={() => selectTrack(TRACKS[0])}
                className="lift mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-ink shadow-[0_12px_34px_-12px_rgba(30,215,96,0.6)]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 translate-x-[1px] fill-current">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Start a focus session
              </button>
            )}
          </section>

          {/* shared category filter — drives curated picks and generated sounds */}
          <div className="rise mb-8 flex flex-wrap items-center gap-2" style={{ animationDelay: '0.08s' }}>
            {['All', 'Focus', 'Calm', 'Sleep', 'Energy'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                  filter === f
                    ? 'bg-accent text-ink shadow-[0_6px_18px_-8px_rgba(30,215,96,0.6)]'
                    : 'glass-soft text-muted hover:text-text'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="rise" style={{ animationDelay: '0.16s' }}>
            <CuratedSection onPlay={openCurated} activeId={curatedTrack?.id ?? null} filter={filter} />
          </div>

          {/* Calm-only: immersive ambient environments roadmap */}
          {(filter === 'Calm' || filter === 'All') && (
            <div className="rise" style={{ animationDelay: '0.2s' }}>
              <CalmEnvironments />
            </div>
          )}

          <div className="rise" style={{ animationDelay: '0.24s' }}>
            <Dashboard
              activeId={active?.id ?? null}
              isPlaying={isPlaying}
              filter={filter}
              soundscapeLabel={soundscapeLabel}
              session={session}
              presetId={presetId}
              setPresetId={setPresetId}
              onToggle={selectTrack}
            />
          </div>
        </main>
      )}

      {/* feedback launcher — always reachable, sits above the player bar */}
      <button
        onClick={() => setFeedbackOpen(true)}
        className={`glass lift fixed right-4 z-30 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold sm:right-6 ${
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

      <YouTubePlayer track={curatedTrack} onClose={() => setCuratedTrack(null)} />

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
