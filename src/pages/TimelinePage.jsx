import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import TimelineSlider from '../components/TimelineSlider'
import { getActiveLayersForPlace, useTimeline } from '../context/TimelineContext'
import usePlacesData from '../hooks/usePlacesData'

function TimelinePage() {
  const { selectedYear, timelineEnabled, setTimelineEnabled } = useTimeline()
  const { places, periods, loading, error } = usePlacesData()

  useEffect(() => {
    if (!timelineEnabled) {
      setTimelineEnabled(true)
    }
  }, [setTimelineEnabled, timelineEnabled])

  const visibleLayers = useMemo(() => {
    return places
      .flatMap((place) =>
        getActiveLayersForPlace(place, selectedYear).map((layer) => ({
          place,
          layer,
        })),
      )
      .sort((a, b) => Number(a.layer.start_year) - Number(b.layer.start_year))
  }, [places, selectedYear])

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <section className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="panel">
            <div className="panel-header">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
                  Esploratore cronologia
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                  Segui la storia nel tempo
                </h1>
            </div>
            <div className="panel-body space-y-4">
              <TimelineSlider periods={periods} />

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                {visibleLayers.length} livelli storici sono attivi nell'anno selezionato.
              </div>

              <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-full border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/10"
                >
                  Apri vista mappa
                </Link>
            </div>
          </div>
        </aside>

        <section className="panel">
          <div className="panel-header flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
                Livelli attivi
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">Visibili in questo periodo</h2>
            </div>
            <p className="text-xs text-slate-400">Ordinati per anno di inizio</p>
          </div>

          <div className="panel-body">
            {error ? (
              <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            {loading ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                Caricamento voci della cronologia…
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleLayers.map(({ place, layer }) => (
                <article
                  key={layer.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-lg shadow-black/10"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">
                    {layer.historical_periods?.name || 'Periodo storico'}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {layer.title || place.canonical_name}
                  </h3>
                  {place.canonical_name ? (
                    <p className="mt-1 text-xs text-slate-400">{place.canonical_name}</p>
                  ) : null}
                  <p className="mt-3 text-sm leading-6 text-slate-300">{layer.short_description}</p>
                  <p className="mt-4 text-xs text-slate-500">
                    {layer.start_year} → {layer.end_year}
                  </p>
                  <Link
                    to={`/place/${place.id}`}
                    state={{ layerId: layer.id }}
                    className="mt-4 inline-flex rounded-full border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
                  >
                    Vedi dettagli
                  </Link>
                </article>
              ))}

              {!loading && visibleLayers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-5 text-sm text-slate-400 md:col-span-2 xl:col-span-3">
                  Nessun livello attivo per quest'anno.
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}

export default TimelinePage
