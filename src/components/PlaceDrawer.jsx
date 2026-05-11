import { useMemo } from 'react'

function PlaceDrawer({ place, onClose, onToggleVisited }) {
  const primaryImage = useMemo(() => {
    if (!place) {
      return null
    }

    return place.place_images?.find((image) => image.is_primary) ?? place.place_images?.[0]
  }, [place])

  if (!place) {
    return null
  }

  const tags = place.place_tags?.map((tag) => tag.tags?.name).filter(Boolean) ?? []
  const podcasts =
    place.place_podcast_episodes?.map((entry) => entry.podcast_episodes).filter(Boolean) ?? []
  const period = place.historical_periods

  return (
    <aside className="pointer-events-auto w-full max-w-xl space-y-5 rounded-3xl border border-slate-800/80 bg-slate-950/90 p-6 shadow-2xl backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
            {period?.name ?? 'Historical place'}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{place.title}</h2>
          <p className="mt-2 text-xs text-slate-400">
            {place.start_year} → {place.end_year}
          </p>
        </div>
        <button
          className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-200"
          type="button"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      {primaryImage?.image_url ? (
        <img
          alt={primaryImage.caption || place.title}
          className="h-48 w-full rounded-2xl object-cover"
          src={primaryImage.image_url}
        />
      ) : null}

      <p className="text-sm leading-6 text-slate-300">{place.long_description}</p>

      <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Coordinates</p>
          <p className="mt-1 text-slate-200">
            {place.latitude}, {place.longitude}
          </p>
        </div>
        {tags.length ? (
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Tags</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {podcasts.length ? (
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Podcasts</p>
            <ul className="mt-2 space-y-2 text-xs text-slate-300">
              {podcasts.map((episode) => (
                <li key={episode.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-sm font-semibold text-white">{episode.title}</p>
                  <p className="mt-1 text-slate-400">{episode.short_description}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="inline-flex items-center justify-center rounded-full border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/10"
          type="button"
          onClick={onToggleVisited}
        >
          {place.visited ? 'Mark as not visited' : 'Mark as visited'}
        </button>
      </div>
    </aside>
  )
}

export default PlaceDrawer
