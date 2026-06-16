import { useEffect, useRef, useState, type CSSProperties } from 'react'
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
import YouTubeBar from './components/YouTubeBar'
import PomodoroApp from './components/PomodoroApp'
import { CURATED, ytThumb, type CuratedTrack } from './data/curated'
import { logPlay } from './feedback/store'

type Route = 'home' | 'pomodoro' | 'insights'
type ViewMode = 'grid' | 'list'

// Filter "states" — each drives the pill colour, the hero copy, and the hero
// accent colour, so switching a category visibly re-themes the page.
type StateKey = 'All' | 'Focus' | 'Calm' | 'Sleep'
const FILTERS: StateKey[] = ['All', 'Focus', 'Calm', 'Sleep']

const STATES: Record<StateKey, { color: string; pre: string; accent: string; sub: string }> = {
  All: {
    color: 'var(--color-accent)',
    pre: 'Sound-engineered focus,',
    accent: 'on demand.',
    sub: 'Pick a soundscape and drop in. Engineered focus audio that loops seamlessly and keeps playing — even with your screen locked.',
  },
  Focus: {
    color: 'var(--color-focus)',
    pre: 'Lock in.',
    accent: 'Deep focus on tap.',
    sub: 'Brown noise, binaural beats, and tracks engineered to pull you into flow — and keep distraction out.',
  },
  Calm: {
    color: 'var(--color-calm)',
    pre: 'Exhale.',
    accent: 'Down-regulate and reset.',
    sub: 'Soft soundscapes and slow waves to settle your nervous system and ease the pressure.',
  },
  Sleep: {
    color: 'var(--color-sleep)',
    pre: 'Wind down.',
    accent: 'Drift into deep sleep.',
    sub: 'Delta and theta soundscapes, brown noise, and long ambient drift to carry you under.',
  },
}

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
  const [filter, setFilter] = useState<StateKey>('All')
  const [view, setView] = useState<ViewMode>('grid')
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
    engine.play(track.id)
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

  // Absolute play/pause that never read isPlaying — safe for the lock-screen
  // Media Session handlers (whose closures can go stale while the screen is
  // locked). Pause keeps the playback position; resume continues from it.
  function pausePlayback() {
    engine.pause()
    setIsPlaying(false)
  }
  function resumePlayback() {
    if (!active) return
    engine.resume()
    setIsPlaying(true)
  }

  function selectTrack(track: Track) {
    if (active?.id === track.id) {
      if (isPlaying) pausePlayback()
      else resumePlayback()
      return
    }
    setActive(track)
    startTrack(track)
  }

  function togglePlay() {
    if (!active) return
    if (isPlaying) pausePlayback()
    else resumePlayback()
  }

  // Prev/next, used by the full-screen players and the lock-screen controls.
  // Steps through whichever list (curated or generated) is currently playing,
  // respecting the active category filter, and wraps around.
  function skip(dir: 1 | -1) {
    if (curatedTrack) {
      const list = filter === 'All' ? CURATED : CURATED.filter((t) => t.category === filter)
      const i = list.findIndex((t) => t.id === curatedTrack.id)
      if (i < 0 || list.length === 0) return
      openCurated(list[(i + dir + list.length) % list.length])
    } else if (active) {
      const list = filter === 'All' ? TRACKS : TRACKS.filter((t) => t.category === filter)
      const i = list.findIndex((t) => t.id === active.id)
      if (i < 0 || list.length === 0) return
      selectTrack(list[(i + dir + list.length) % list.length])
    }
  }

  // Lock-screen / OS media controls (Media Session API). Metadata + skip
  // handlers live here since App owns the queue; each player wires its own
  // play/pause + playbackState.
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    const ms = navigator.mediaSession
    if (curatedTrack) {
      ms.metadata = new MediaMetadata({
        title: curatedTrack.title,
        artist: curatedTrack.artist,
        album: 'NeuroNest',
        artwork: [{ src: ytThumb(curatedTrack.id), sizes: '480x360', type: 'image/jpeg' }],
      })
    } else if (active) {
      ms.metadata = new MediaMetadata({
        title: active.title,
        artist: active.subtitle,
        album: 'NeuroNest',
        artwork: [{ src: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
      })
    } else {
      ms.metadata = null
    }
    ms.setActionHandler('nexttrack', () => skip(1))
    ms.setActionHandler('previoustrack', () => skip(-1))
    return () => {
      ms.setActionHandler('nexttrack', null)
      ms.setActionHandler('previoustrack', null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, curatedTrack, filter])

  if (route === 'insights') return <InsightsView onClose={() => go('home')} />

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const soundscapeLabel = curatedTrack?.title ?? active?.title ?? null
  const state = STATES[filter]

  return (
    <div
      className="app-aurora relative min-h-full"
      style={{ '--state': state.color } as CSSProperties}
    >
      <div className="grain" aria-hidden="true" />

      {/* sticky glass header — pads for the device notch / status bar (safe-area) */}
      <header className="sticky top-0 z-30 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="glass mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-2xl px-3 py-2 sm:px-5">
          <button onClick={() => go('home')} className="flex items-center gap-2.5">
            <img
              src="/icon-source.png"
              alt="Neuronest"
              className="h-9 w-9 rounded-xl ring-1 ring-accent/20 shadow-[0_0_18px_-5px_rgba(30,215,96,0.5)]"
            />
            <span className="hidden font-display text-lg font-semibold tracking-tight sm:inline">
              Neuronest
            </span>
          </button>

          {/* single ergonomic toggle — one tap always flips to the other view.
              Equal-width columns keep the raised knob perfectly aligned. */}
          <button
            onClick={() => go(route === 'pomodoro' ? 'home' : 'pomodoro')}
            role="switch"
            aria-checked={route === 'pomodoro'}
            aria-label="Toggle Home / Pomodoro"
            className="nav-toggle relative inline-grid grid-cols-2 items-center rounded-full p-1 text-sm font-semibold"
          >
            {/* recessed track is the button bg; this is the raised gradient knob */}
            <span
              className="nav-knob pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full transition-transform duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)]"
              style={{ transform: route === 'pomodoro' ? 'translateX(100%)' : 'translateX(0)' }}
              aria-hidden="true"
            />
            <span className={`relative z-10 px-4 py-1.5 text-center transition-colors duration-200 ${route !== 'pomodoro' ? 'text-ink' : 'text-muted'}`}>
              Home
            </span>
            <span className={`relative z-10 px-4 py-1.5 text-center transition-colors duration-200 ${route === 'pomodoro' ? 'text-ink' : 'text-muted'}`}>
              Pomodoro
            </span>
            {session.phase === 'focusing' && route !== 'pomodoro' && (
              <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-focus ring-2 ring-ink" aria-hidden="true" />
            )}
          </button>

          <span className="hidden rounded-full px-3 py-1 text-[11px] font-medium text-muted sm:inline-block">
            Prototype
          </span>
        </div>
      </header>

      {/* keyed wrapper → content fades in when the mode (Home/Pomodoro) flips */}
      <div key={route} className="fade-swap">
      {route === 'pomodoro' ? (
        <PomodoroApp
          session={session}
          presetId={presetId}
          setPresetId={setPresetId}
          soundscapeLabel={soundscapeLabel}
        />
      ) : (
        <main className="relative z-10 mx-auto max-w-6xl px-4 pb-36 pt-8 sm:px-6 sm:pt-12">
          {/* hero — copy + accent colour re-theme per active state */}
          <section className="rise mb-12">
            <p className="text-sm font-medium text-muted">{greeting}.</p>
            {/* keyed by state → headline + subcopy fade/swap when the state changes */}
            <div key={filter} className="fade-swap">
              <h1 className="mt-2 max-w-2xl text-balance font-display text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.03em] sm:text-6xl">
                {state.pre}{' '}
                <span style={{ color: state.color }}>{state.accent}</span>
              </h1>
              <p className="mt-5 max-w-md text-pretty text-[15px] leading-relaxed text-muted">
                {state.sub}
              </p>
            </div>
            {!active && !curatedTrack && (
              <button
                onClick={() => selectTrack(TRACKS[0])}
                className="lift mt-7 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-ink"
                style={{ backgroundColor: state.color, boxShadow: '0 12px 34px -12px rgba(0,0,0,0.5)' }}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 translate-x-[1px] fill-current">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Start listening
              </button>
            )}
          </section>

          {/* shared state filter + view-mode switch */}
          <div className="rise mb-8 flex flex-wrap items-center gap-2" style={{ animationDelay: '0.08s' }}>
            {FILTERS.map((f) => {
              const activeF = filter === f
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                    activeF ? 'text-ink' : 'glass-soft text-muted hover:text-text'
                  }`}
                  style={
                    activeF
                      ? { backgroundColor: STATES[f].color, boxShadow: '0 6px 18px -8px rgba(0,0,0,0.5)' }
                      : undefined
                  }
                >
                  {f}
                </button>
              )
            })}

            {/* grid / list view toggle */}
            <div className="glass-soft ml-auto flex items-center rounded-full p-1">
              {(['grid', 'list'] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  aria-label={`${v} view`}
                  aria-pressed={view === v}
                  className={`grid h-8 w-8 place-items-center rounded-full transition ${
                    view === v ? 'bg-text text-ink' : 'text-muted hover:text-text'
                  }`}
                >
                  {v === 'grid' ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                      <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                      <path d="M3 5h18v2H3zM3 11h18v2H3zM3 17h18v2H3z" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="rise" style={{ animationDelay: '0.16s' }}>
            <CuratedSection
              onPlay={openCurated}
              activeId={curatedTrack?.id ?? null}
              filter={filter}
              view={view}
            />
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
              view={view}
              onToggle={selectTrack}
            />
          </div>
        </main>
      )}
      </div>

      {/* feedback launcher — always reachable, sits above the player bar */}
      <button
        onClick={() => setFeedbackOpen(true)}
        className={`glass lift fixed right-4 z-30 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold sm:right-6 ${
          active || curatedTrack ? 'bottom-24' : 'bottom-5'
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

      {/* curated YouTube playback (its own bottom bar + full-screen view) */}
      {curatedTrack && (
        <YouTubeBar
          track={curatedTrack}
          onClose={() => setCuratedTrack(null)}
          onNext={() => skip(1)}
          onPrev={() => skip(-1)}
        />
      )}

      <Player
        track={curatedTrack ? null : active}
        isPlaying={isPlaying}
        volume={volume}
        onTogglePlay={togglePlay}
        onPlay={resumePlayback}
        onPause={pausePlayback}
        onVolume={setVolume}
        onNext={() => skip(1)}
        onPrev={() => skip(-1)}
      />
    </div>
  )
}
