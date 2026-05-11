import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import TimelineSlider from '../components/TimelineSlider'
import { isPlaceVisibleAtYear, useTimeline } from '../context/TimelineContext'
import usePlacesData from '../hooks/usePlacesData'

function TimelinePage() {
  const { selectedYear, timelineEnabled, setTimelineEnabled } = useTimeline()
  const { places, periods, loading, error } = usePlacesData()

  useEffect(() => {
    if (!timelineEnabled) {
      setTimelineEnabled(true)
    }
  }, [setTimelineEnabled, timelineEnabled])

  const visiblePlaces = useMemo(
    () =>
      places
        .filter((place) => isPlaceVisibleAtYear(place, selectedYear))
        .sort((a, b) => a.start_year - b.start_year),
    [places, selectedYear],
  )

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <section className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="panel">
            <div className="panel-header">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
                Timeline explorer
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                Follow the story through time
              </h1>
            </div>
            <div className="panel-body space-y-4">
              <TimelineSlider periods={periods} />

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                {visiblePlaces.length} places are active in the selected year.
              </div>

              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-full border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/10"
              >
                Open map view
              </Link>
            </div>
          </div>
        </aside>

        <section className="panel">
          <div className="panel-header flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
                Active places
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">Visible in this period</h2>
            </div>
            <p className="text-xs text-slate-400">Sorted by start year</p>
          </div>

          <div className="panel-body">
            {error ? (
              <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                Loading timeline entries…
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visiblePlaces.map((place) => (
                <article
                  key={place.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-lg shadow-black/10"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">
                    {place.historical_periods?.name || 'Historical place'}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{place.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{place.short_description}</p>
                  <p className="mt-4 text-xs text-slate-500">
                    {place.start_year} → {place.end_year}
                  </p>
                  <Link
                    to={`/place/${place.id}`}
                    className="mt-4 inline-flex rounded-full border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
                  >
                    View details
                  </Link>
                </article>
              ))}

              {!loading && visiblePlaces.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-5 text-sm text-slate-400 md:col-span-2 xl:col-span-3">
                  No places are active for this year yet.
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
