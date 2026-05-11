import { useEffect, useMemo, useState } from 'react'
import Map from '../components/Map'
import TimelineSlider from '../components/TimelineSlider'
import MobilePanel from '../components/MobilePanel'
import PlaceDrawer from '../components/PlaceDrawer'
import usePlacesData from '../hooks/usePlacesData'
import { isPlaceVisibleAtYear, useTimeline } from '../context/TimelineContext'
import { updatePlaceVisited } from '../services/places'

const normalizeText = (value) => value?.toString().toLowerCase().trim() ?? ''

function HomeMap() {
  const { selectedYear, timelineEnabled } = useTimeline()
  const { places, setPlaces, periods, loading, error } = usePlacesData()
  const [query, setQuery] = useState('')
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024)
    handleResize()
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const filteredPlaces = useMemo(() => {
    const search = normalizeText(query)

    return places.filter((place) => {
      const matchesQuery =
        !search ||
        normalizeText(place.title).includes(search) ||
        normalizeText(place.short_description).includes(search)

      const matchesTimeline = timelineEnabled ? isPlaceVisibleAtYear(place, selectedYear) : true

      return matchesQuery && matchesTimeline
    })
  }, [places, query, selectedYear, timelineEnabled])

  const statsLabel = timelineEnabled
    ? 'Visible places in selected year'
    : 'Places available in archive'

  const handleToggleVisited = async () => {
    if (!selectedPlace) {
      return
    }

    const { data, error: supabaseError } = await updatePlaceVisited(
      selectedPlace.id,
      !selectedPlace.visited,
    )

    if (supabaseError) {
      return
    }

    setPlaces((current) =>
      current.map((place) => (place.id === data.id ? { ...place, visited: data.visited } : place)),
    )
    setSelectedPlace((current) => (current ? { ...current, visited: data.visited } : current))
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <section className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="hidden space-y-5 lg:block">
          <div className="panel overflow-hidden">
            <div className="panel-header">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
                Story atlas
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                Lecco historical map archive
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                The map is the core: explore the places, reveal their stories, and move through time
                only when you want.
              </p>
            </div>

            <div className="panel-body space-y-4">
              <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{statsLabel}</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{filteredPlaces.length}</p>
                </div>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">Search the archive</span>
                <input
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="Search by title or description"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>

              <TimelineSlider periods={periods} />

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

              <div className="max-h-[24rem] space-y-3 overflow-auto pr-1">
                {filteredPlaces.length === 0 && !loading ? (
                  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-400">
                    No places match the current filters.
                  </div>
                ) : null}

                {filteredPlaces.map((place) => (
                  <button
                    key={place.id}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-left shadow-lg shadow-black/10 transition hover:border-cyan-400/40"
                    type="button"
                    onClick={() => setSelectedPlace(place)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold text-white">{place.title}</h2>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-cyan-300/70">
                          {place.historical_periods?.name || 'Historical place'}
                        </p>
                      </div>
                      <span className="rounded-full border border-cyan-400/30 px-3 py-1 text-xs font-semibold text-cyan-200">
                        View
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">
                      {place.short_description}
                    </p>
                    <p className="mt-3 text-xs text-slate-500">
                      {place.start_year} → {place.end_year}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-950/70 shadow-2xl">
          <div className="absolute left-4 top-4 z-20 hidden rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3 text-xs text-slate-300 shadow-lg lg:block">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/80">Interactive map</p>
            <p className="mt-1 text-sm text-white">Lecco historical atlas</p>
          </div>

          <div className="h-[calc(100vh-120px)] min-h-[70vh]">
            <Map
              places={filteredPlaces}
              activePlaceId={selectedPlace?.id}
              onSelectPlace={(place) => setSelectedPlace(place)}
            />
          </div>

          <div className="pointer-events-none absolute inset-0 hidden items-end justify-end p-6 lg:flex">
            <PlaceDrawer
              place={selectedPlace}
              onClose={() => setSelectedPlace(null)}
              onToggleVisited={handleToggleVisited}
            />
          </div>
        </section>
      </section>

      <button
        className="fixed bottom-6 right-6 z-40 rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-xl shadow-cyan-500/30 transition hover:bg-cyan-300 lg:hidden"
        type="button"
        onClick={() => setIsMobilePanelOpen(true)}
      >
        Filters
      </button>

      <MobilePanel
        isOpen={isMobilePanelOpen}
        title="Explore"
        onClose={() => setIsMobilePanelOpen(false)}
      >
        <div className="space-y-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-200">Search the archive</span>
            <input
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
              placeholder="Search by title or description"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <TimelineSlider periods={periods} />

          <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{statsLabel}</p>
              <p className="mt-1 text-2xl font-semibold text-white">{filteredPlaces.length}</p>
            </div>
          </div>

          <div className="space-y-3">
            {filteredPlaces.map((place) => (
              <button
                key={place.id}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-left shadow-lg shadow-black/10 transition hover:border-cyan-400/40"
                type="button"
                onClick={() => {
                  setSelectedPlace(place)
                  setIsMobilePanelOpen(false)
                }}
              >
                <h3 className="text-base font-semibold text-white">{place.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{place.short_description}</p>
              </button>
            ))}
          </div>
        </div>
      </MobilePanel>

      <MobilePanel
        isOpen={Boolean(selectedPlace) && !isDesktop}
        title="Place detail"
        onClose={() => setSelectedPlace(null)}
      >
        <PlaceDrawer
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onToggleVisited={handleToggleVisited}
        />
      </MobilePanel>
    </main>
  )
}

export default HomeMap
