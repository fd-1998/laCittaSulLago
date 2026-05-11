import { useEffect, useMemo, useState } from 'react'
import Map from '../components/Map'
import TimelineSlider from '../components/TimelineSlider'
import { filterPlacesByYear, useTimeline } from '../context/TimelineContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

function HomeMap() {
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { selectedYear } = useTimeline()

  useEffect(() => {
    let isMounted = true

    async function loadPlaces() {
      setLoading(true)
      setError('')

      try {
        const { data, error: supabaseError } = await supabase.from('places').select('*')

        if (supabaseError) {
          throw supabaseError
        }

        if (isMounted) {
          setPlaces(data ?? [])
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load places.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadPlaces()

    return () => {
      isMounted = false
    }
  }, [])

  const visiblePlaces = useMemo(
    () => filterPlacesByYear(places, selectedYear),
    [places, selectedYear],
  )

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <section className="grid gap-5 lg:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="panel overflow-hidden">
            <div className="panel-header">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
                GIS dashboard
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                Historical locations in the Lecco area
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Explore podcast locations through a timeline-driven map. Move the year slider to
                reveal places that were active in that period.
              </p>
            </div>

            <div className="panel-body space-y-4">
              <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Visible places</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{visiblePlaces.length}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Data source</p>
                  <p className="mt-1 text-sm font-medium text-slate-200">
                    {isSupabaseConfigured ? 'Supabase places table' : 'Supabase not configured'}
                  </p>
                </div>
              </div>

              <TimelineSlider />

              {error ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              {loading ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                  Loading places…
                </div>
              ) : null}

              <div className="space-y-3 max-h-[24rem] overflow-auto pr-1">
                {visiblePlaces.length === 0 && !loading ? (
                  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-400">
                    No places match the selected year.
                  </div>
                ) : null}

                {visiblePlaces.map((place) => (
                  <article
                    key={place.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-lg shadow-black/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold text-white">{place.title}</h2>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-cyan-300/70">
                          {place.period_label || 'Historical place'}
                        </p>
                      </div>
                      <a
                        href={`/place/${place.id}`}
                        className="rounded-full border border-cyan-400/30 px-3 py-1 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-400/10"
                      >
                        Details
                      </a>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">
                      {place.description}
                    </p>
                    <p className="mt-3 text-xs text-slate-500">
                      {place.start_year} → {place.end_year}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="panel overflow-hidden">
          <div className="panel-header flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
                Interactive map
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">Lecco GIS view</h2>
            </div>
            <p className="text-xs text-slate-400">Markers update with the selected timeline year</p>
          </div>
          <div className="panel-body">
            <Map places={places} selectedYear={selectedYear} />
          </div>
        </section>
      </section>
    </main>
  )
}

export default HomeMap
