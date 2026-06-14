import { TRACKS, type Track } from '../data/tracks'
import TrackCard from './TrackCard'
import Pomodoro from './Pomodoro'

interface Props {
  activeId: string | null
  isPlaying: boolean
  filter: string
  onToggle: (track: Track) => void
}

export default function Dashboard({ activeId, isPlaying, filter, onToggle }: Props) {
  const visible = filter === 'All' ? TRACKS : TRACKS.filter((t) => t.category === filter)

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      {/* left — generative track library */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Generated Soundscapes</h2>
            <p className="mt-0.5 text-xs text-muted">Made live on your device — no streaming.</p>
          </div>
          <span className="text-xs text-muted">{visible.length} tracks</span>
        </div>

        {visible.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-muted">
            No generated sounds in this category yet.
          </p>
        ) : (
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
        )}
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
