import { TRACKS, type Track } from '../data/tracks'
import TrackCard from './TrackCard'
import FocusSession from './FocusSession'

interface Props {
  activeId: string | null
  isPlaying: boolean
  filter: string
  soundscapeLabel: string | null
  onToggle: (track: Track) => void
}

export default function Dashboard({ activeId, isPlaying, filter, soundscapeLabel, onToggle }: Props) {
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
          <p className="glass-soft rounded-3xl p-6 text-center text-sm text-muted">
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

      {/* right — focus session + tip */}
      <aside className="flex flex-col gap-5">
        <FocusSession soundscapeLabel={soundscapeLabel} />
        <div className="glass rounded-3xl p-5">
          <p className="font-display text-sm font-semibold">Pair sound with time</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            Start a focus block, press play on a soundscape, and let Neuronest hold the line
            between you and every distraction.
          </p>
        </div>
      </aside>
    </div>
  )
}
