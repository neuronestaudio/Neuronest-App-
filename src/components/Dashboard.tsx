import { TRACKS, type Track } from '../data/tracks'
import TrackCard from './TrackCard'
import TrackRow from './TrackRow'

interface Props {
  activeId: string | null
  isPlaying: boolean
  filter: string
  view: 'grid' | 'list'
  onToggle: (track: Track) => void
}

export default function Dashboard({ activeId, isPlaying, filter, view, onToggle }: Props) {
  const visible = filter === 'All' ? TRACKS : TRACKS.filter((t) => t.category === filter)

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold">Generated Soundscapes</h2>
          <p className="mt-0.5 text-xs text-muted">Made live on your device — no streaming.</p>
        </div>
        <span className="text-xs text-muted">{visible.length} tracks</span>
      </div>

      {visible.length === 0 ? (
        <p className="glass-soft rounded-3xl p-6 text-center text-sm text-muted">
          No generated sounds in this category yet.
        </p>
      ) : view === 'list' ? (
        <div className="flex flex-col gap-1.5">
          {visible.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              isActive={activeId === track.id}
              isPlaying={isPlaying}
              onToggle={onToggle}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
  )
}
