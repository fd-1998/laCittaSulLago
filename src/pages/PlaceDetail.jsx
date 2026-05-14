import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getActiveLayersForPlace, getDefaultLayerForPlace, useTimeline } from '../context/TimelineContext'
import { fetchPlaceById } from '../services/places'

function PlaceDetail() {
  const { id } = useParams()
  const location = useLocation()
  const { selectedYear, timelineEnabled } = useTimeline()
  const [place, setPlace] = useState(null)
  const [selectedLayerId, setSelectedLayerId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadPlace() {
      setLoading(true)
      setError('')

      const { data, error: supabaseError } = await fetchPlaceById(id)

      if (!isMounted) {
        return
      }

      if (supabaseError) {
        setError(supabaseError.message)
        setLoading(false)
        return
      }

      setPlace(data)
      setLoading(false)
    }

    loadPlace()

    return () => {
      isMounted = false
    }
  }, [id])

  useEffect(() => {
    if (location.state?.layerId) {
      setSelectedLayerId(location.state.layerId)
    }
  }, [location.state])

  const activeLayers = useMemo(() => {
    if (!place) {
      return []
    }

    return timelineEnabled
      ? getActiveLayersForPlace(place, selectedYear)
      : [getDefaultLayerForPlace(place)].filter(Boolean)
  }, [place, selectedYear, timelineEnabled])

  const activeLayer = useMemo(() => {
    if (!place) {
      return null
    }

    return (
      activeLayers.find((layer) => layer.id === selectedLayerId) ??
      activeLayers[0] ??
      place.place_historical_layers?.[0] ??
      null
    )
  }, [activeLayers, place, selectedLayerId])

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

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
      <section className="panel">
        <div className="panel-header flex items-center justify-between gap-3">
          <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
                Dettagli luogo
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                Dettaglio del luogo
              </h1>
          </div>
          <Link
            to="/"
            className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
          >
              Torna alla mappa
          </Link>
        </div>

        <div className="panel-body space-y-5">
          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                Caricamento luogo…
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          {place ? (
            <>
              <article className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">
                      {activeLayer?.historical_periods?.name || 'Periodo storico'}
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold text-white">
                      {activeLayer?.title || place.canonical_name || 'Luogo storico'}
                    </h2>
                    {place.canonical_name ? (
                      <p className="mt-1 text-sm text-slate-400">{place.canonical_name}</p>
                    ) : null}
                  </div>

                  {activeLayers.length > 1 ? (
                    <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3">
                      {activeLayers.map((layer) => (
                        <button
                          key={layer.id}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                            layer.id === activeLayer?.id
                              ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-200'
                              : 'border-slate-800 text-slate-300 hover:border-cyan-400/40 hover:text-white'
                          }`}
                          type="button"
                          onClick={() => setSelectedLayerId(layer.id)}
                        >
                          {layer.title ?? layer.historical_periods?.name ?? 'Layer'}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {primaryImage?.image_url ? (
                    <img
                      alt={primaryImage.caption || activeLayer?.title || place.canonical_name}
                      className="h-56 w-full rounded-2xl object-cover"
                      src={primaryImage.image_url}
                    />
                  ) : null}

                  {activeLayer?.long_description ? (
                    <p className="text-base leading-7 text-slate-300">{activeLayer.long_description}</p>
                  ) : null}

                  <Link
                    to="/"
                    className="inline-flex items-center justify-center rounded-full border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/10"
                  >
                    Apri nella mappa
                  </Link>
                </div>

                <aside className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Coordinate</p>
                    <p className="mt-1 text-sm font-medium text-slate-200">
                      {place.latitude}, {place.longitude}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Cronologia</p>
                    <p className="mt-1 text-sm font-medium text-slate-200">
                      {activeLayer?.start_year} → {activeLayer?.end_year}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Periodo</p>
                    <p className="mt-1 text-sm font-medium text-slate-200">
                      {activeLayer?.historical_periods?.name || '—'}
                    </p>
                  </div>
                </aside>
              </article>
              {activeLayer ? (
                <section className="mt-6 grid gap-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                {activeLayer.place_images?.length ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Immagini</p>
                    <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                      {activeLayer.place_images.map((image) => (
                        <img
                          key={image.id}
                          alt={image.caption || activeLayer.title || place.canonical_name}
                          className="h-32 w-full rounded-2xl object-cover"
                          src={image.thumbnail_url || image.image_url}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {place.place_tags?.length ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Tag</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {place.place_tags.map((tag) => (
                        <span
                          key={tag.tags?.id ?? tag.tags?.name}
                          className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200"
                        >
                          {tag.tags?.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {activeLayer.place_podcast_episodes?.length ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Podcast</p>
                    <div className="mt-3 grid gap-3">
                      {activeLayer.place_podcast_episodes.map((entry) => (
                        <div
                          key={entry.podcast_episodes?.id}
                          className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                        >
                          <p className="text-sm font-semibold text-white">
                            {entry.podcast_episodes?.title}
                          </p>
                          <p className="mt-1 text-sm text-slate-400">
                            {entry.podcast_episodes?.short_description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {activeLayer.notes?.length ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Note</p>
                    <div className="mt-3 grid gap-3">
                      {activeLayer.notes.map((note) => (
                        <div key={note.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                          <p className="text-sm font-semibold text-white">{note.title}</p>
                          {note.subtitle ? (
                            <p className="mt-1 text-sm text-cyan-200">{note.subtitle}</p>
                          ) : null}
                          <p className="mt-2 text-sm text-slate-400">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                </section>
              ) : null}
            </>
          ) : null}
        </div>
      </section>
    </main>
  )
}

export default PlaceDetail
