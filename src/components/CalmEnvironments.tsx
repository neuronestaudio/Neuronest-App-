import { ENVIRONMENTS, envThumb } from '../data/environments'

// Library of immersive ambient soundscapes — surfaced in the Calm section.
export default function CalmEnvironments() {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Ambient Soundscapes</h2>
          <p className="mt-1 max-w-md text-sm text-muted">
            Immersive places to disappear into.{' '}
            <span className="text-calm">In the works — coming soon.</span>
          </p>
        </div>
        <span className="glass-soft hidden shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-calm sm:inline-block">
          {ENVIRONMENTS.length} planned
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {ENVIRONMENTS.map((env) => (
          <div
            key={env.id}
            className="glass-soft group relative overflow-hidden rounded-3xl p-3"
            aria-disabled={!env.available}
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
              <img
                src={envThumb(env.id)}
                alt={env.name}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              {!env.available && (
                <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/90 backdrop-blur">
                  Soon
                </span>
              )}
            </div>
            <div className="px-0.5 pb-1 pt-3">
              <p className="truncate text-sm font-semibold">{env.name}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted">{env.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
