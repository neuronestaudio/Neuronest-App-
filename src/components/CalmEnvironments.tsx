import { ENVIRONMENTS } from '../data/environments'

// Roadmap of immersive ambient environments — surfaced in the Calm section.
export default function CalmEnvironments() {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Ambient Environments</h2>
          <p className="mt-1 max-w-md text-sm text-muted">
            Immersive places to disappear into.{' '}
            <span className="text-calm">In the works — coming soon.</span>
          </p>
        </div>
        <span className="glass-soft hidden shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-calm sm:inline-block">
          {ENVIRONMENTS.length} planned
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {ENVIRONMENTS.map((env) => (
          <div
            key={env.id}
            className="glass-soft group relative overflow-hidden rounded-3xl p-3"
            aria-disabled="true"
          >
            <div
              className={`relative grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl bg-gradient-to-br ${env.gradient} opacity-55`}
            >
              <span className="text-4xl grayscale-[0.15]">{env.glyph}</span>
              <span className="absolute inset-0 bg-black/30" />
              {/* lock */}
              <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/55 backdrop-blur">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white/90">
                  <path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm3 8H9V6a3 3 0 0 1 6 0v3z" />
                </svg>
              </span>
            </div>
            <div className="px-0.5 pb-1 pt-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold">{env.name}</p>
                <span className="shrink-0 rounded-full bg-calm/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-calm">
                  Soon
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted">{env.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
