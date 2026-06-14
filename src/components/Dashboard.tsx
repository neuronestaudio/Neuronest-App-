import { useState } from 'react'
import { CATEGORIES, TRACKS, type Category, type Track } from '../data/tracks'
import TrackCard from './TrackCard'
import Pomodoro from './Pomodoro'

interface Props {
  activeId: string | null
  isPlaying: boolean
  onToggle: (track: Track) => void
}

type Filter = Category | 'All'

export default function Dashboard({ activeId, isPlaying, onToggle }: Props) {
  const [filter, setFilter] = useState<Filter>('All')
  const filters: Filter[] = ['All', ...CATEGORIES]
  const visible = filter === 'All' ? TRACKS : TRACKS.filter((t) => t.category === filter)

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      {/* left — track library */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Soundscapes</h2>
          <span className="text-xs text-muted">{TRACKS.length} tracks</span>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto scrollbar-none">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                filter === f
                  ? 'border-accent bg-accent/15 text-text'
                  : 'border-line text-muted hover:text-text'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {visible.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              isActive={activeId === track.id}
              isPlaying={isPlaying}
              onToggle={onToggle}
            />
          ))}
        </div>
      </section>

      {/* right — focus timer + tip */}
      <aside className="flex flex-col gap-5">
        <Pomodoro />
        <div className="rounded-2xl border border-line bg-gradient-to-br from-surface to-surface-2 p-5">
          <p className="font-display text-sm font-semibold">Pair sound with time</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            Start a 25-minute focus session, press play on a soundscape, and let Neuronest hold
            the line between you and every distraction.
          </p>
        </div>
      </aside>
    </div>
  )
}
