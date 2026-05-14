import { useMemo } from 'react'
import { CloseIcon, TimelineIcon } from './UiIcons'

function PlaceDrawer({ place, activeLayer, activeLayers = [], onSelectLayer, onClose, onToggleVisited }) {
  const primaryImage = useMemo(() => {
    if (!activeLayer) {
      return null
    }

    return (
      activeLayer.place_images?.find((image) => image.is_primary) ??
      activeLayer.place_images?.[0] ??
      null
    )
  }, [activeLayer])

  if (!place || !activeLayer) {
    return null
  }

  const tags = place.place_tags?.map((tag) => tag.tags?.name).filter(Boolean) ?? []
  const podcasts =
    activeLayer.place_podcast_episodes?.map((entry) => entry.podcast_episodes).filter(Boolean) ?? []
  const notes = activeLayer.notes ?? []
  const period = activeLayer.historical_periods
  const images = activeLayer.place_images ?? []

  return (
    <aside className="pointer-events-auto flex w-full max-w-xl flex-col rounded-3xl border border-slate-800/80 bg-slate-950/90 p-6 shadow-2xl backdrop-blur lg:h-full lg:max-h-full lg:overflow-y-auto lg:overscroll-contain lg:touch-pan-y">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
            {period?.name ?? 'Periodo storico'}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {activeLayer.title ?? place.canonical_name ?? 'Luogo storico'}
          </h2>
          {place.canonical_name ? (
            <p className="mt-1 text-sm text-slate-400">{place.canonical_name}</p>
          ) : null}
          <p className="mt-2 text-xs text-slate-400">
            {activeLayer.start_year} → {activeLayer.end_year}
          </p>
        </div>
        <button
          aria-label="Chiudi dettagli luogo"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 text-slate-200 transition hover:border-cyan-400/40 hover:text-white"
          type="button"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      </div>

      <div className="mt-5 space-y-5 pr-1 lg:pb-6">
        {activeLayers.length > 1 ? (
          <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3">
            {activeLayers.map((layer) => (
              <button
                key={layer.id}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  layer.id === activeLayer.id
                    ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-200'
                    : 'border-slate-800 text-slate-300 hover:border-cyan-400/40 hover:text-white'
                }`}
                type="button"
                onClick={() => onSelectLayer?.(layer)}
              >
                {layer.title ?? period?.name ?? 'Layer'}
              </button>
            ))}
          </div>
        ) : null}

        {primaryImage?.image_url ? (
          <img
            alt={primaryImage.caption || activeLayer.title || place.canonical_name}
            className="h-48 w-full rounded-2xl object-cover"
            src={primaryImage.image_url}
          />
        ) : null}

        {images.length > 1 ? (
          <div className="grid grid-cols-3 gap-2">
            {images
              .filter((image) => image.thumbnail_url || image.image_url)
              .slice(0, 6)
              .map((image) => (
                <img
                  key={image.id}
                  alt={image.caption || activeLayer.title || place.canonical_name}
                  className="h-20 w-full rounded-xl object-cover"
                  src={image.thumbnail_url || image.image_url}
                />
              ))}
          </div>
        ) : null}

        <p className="text-sm leading-6 text-slate-300">{activeLayer.long_description}</p>

        <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Coordinate</p>
            <p className="mt-1 text-slate-200">
              {place.latitude}, {place.longitude}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Cronologia</p>
            <p className="mt-1 text-slate-200">
              {activeLayer.start_year} → {activeLayer.end_year}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Periodo</p>
            <p className="mt-1 text-slate-200">{period?.name ?? '—'}</p>
          </div>
          {tags.length ? (
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Tag</p>
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
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Podcast</p>
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
          {notes.length ? (
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Note</p>
              <ul className="mt-2 space-y-2 text-xs text-slate-300">
                {notes.map((note) => (
                  <li key={note.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                    <p className="text-sm font-semibold text-white">{note.title}</p>
                    {note.subtitle ? <p className="mt-1 text-slate-400">{note.subtitle}</p> : null}
                    {note.content ? <p className="mt-2 text-slate-400">{note.content}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/10"
            type="button"
            onClick={onToggleVisited}
          >
            <TimelineIcon className="h-4 w-4" />
            {place.visited ? 'Visitato' : 'Non visitato'}
          </button>
        </div>
      </div>
    </aside>
  )
}

export default PlaceDrawer
