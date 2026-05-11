import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Map from '../components/Map'
import PlaceDrawer from '../components/PlaceDrawer'
import TimelineSlider from '../components/TimelineSlider'
import {
  AddIcon,
  CloseIcon,
  FilterIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  MenuIcon,
  LayersIcon,
  NotesIcon,
  PodcastsIcon,
  TimelineIcon,
} from '../components/UiIcons'
import { isPlaceVisibleAtYear, useTimeline } from '../context/TimelineContext'
import usePlacesData from '../hooks/usePlacesData'
import { updatePlaceVisited } from '../services/places'

const mobileLinks = [
  { to: '/', label: 'Map', icon: HomeIcon },
  { to: '/timeline', label: 'Timeline', icon: TimelineIcon },
  { to: '/podcasts', label: 'Podcasts', icon: PodcastsIcon },
  { to: '/notes', label: 'Notes', icon: NotesIcon },
  { to: '/add-location', label: 'Add', icon: AddIcon },
]

function HomeMap() {
  const { selectedYear, timelineEnabled } = useTimeline()
  const { places, setPlaces, periods, loading, error } = usePlacesData()
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  const [isDesktopFiltersOpen, setIsDesktopFiltersOpen] = useState(true)
  const [selectedPeriodId, setSelectedPeriodId] = useState('all')

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      const matchesTimeline = timelineEnabled ? isPlaceVisibleAtYear(place, selectedYear) : true
      const matchesPeriod =
        selectedPeriodId === 'all' || String(place.period_id) === String(selectedPeriodId)

      return matchesTimeline && matchesPeriod
    })
  }, [places, selectedYear, timelineEnabled, selectedPeriodId])

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
    <main className="relative h-[100dvh] overflow-hidden bg-slate-950">
      <section
        className="grid h-full w-full lg:transition-[grid-template-columns]"
        style={{
          gridTemplateColumns: isDesktopFiltersOpen ? '24rem minmax(0,1fr)' : '4.75rem minmax(0,1fr)',
        }}
      >
        <aside className="relative z-[2500] hidden h-full flex-col border-r border-slate-800/80 bg-slate-950/80 backdrop-blur lg:flex">
          <div className="sticky top-0 z-[2501] border-b border-slate-800/80 bg-slate-950/90 px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/80">
              La Città sul Lago
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Lecco historical atlas</h1>
            {loading ? <p className="mt-2 text-xs text-slate-400">Loading archive…</p> : null}
            {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
          </div>

          <div className="relative flex-1 overflow-hidden px-5 py-5">
            <button
              aria-label={isDesktopFiltersOpen ? 'Collapse filters' : 'Expand filters'}
              className="absolute -right-4 top-6 z-[2503] flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-950 text-cyan-300 shadow-xl transition hover:border-cyan-400/40"
              type="button"
              onClick={() => setIsDesktopFiltersOpen((value) => !value)}
            >
              {isDesktopFiltersOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </button>

            {isDesktopFiltersOpen ? (
              <div className="flex h-full min-h-0 flex-col gap-4">
                <div className="rounded-3xl border border-slate-800/80 bg-slate-950/70 p-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                      <FilterIcon />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Filters</p>
                      <p className="text-xs text-slate-400">Timeline + historical period</p>
                    </div>
                  </div>
                </div>

                <TimelineSlider periods={periods} />

                <label className="space-y-2 rounded-3xl border border-slate-800/80 bg-slate-950/70 p-4 shadow-lg">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
                    <LayersIcon className="h-4 w-4 text-cyan-300" />
                    Historical period
                  </span>
                  <select
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                    value={selectedPeriodId}
                    onChange={(event) => setSelectedPeriodId(event.target.value)}
                  >
                    <option value="all">All periods</option>
                    {periods.map((period) => (
                      <option key={period.id} value={period.id}>
                        {period.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : (
              <div className="flex h-full items-start justify-center pt-14">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-cyan-300 shadow-lg">
                  <FilterIcon />
                </div>
              </div>
            )}
          </div>
        </aside>

        <section className="relative h-full min-w-0">
          <div className="absolute left-4 top-4 z-[2500] max-w-[min(22rem,calc(100vw-8rem))] rounded-3xl border border-slate-800/80 bg-slate-950/70 px-4 py-3 shadow-2xl backdrop-blur lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/80">
              La Città sul Lago
            </p>
          </div>

          <div className="absolute right-4 top-4 z-[2600] flex items-center gap-2 lg:hidden">
            <button
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-950/80 text-slate-100 shadow-2xl backdrop-blur transition hover:bg-slate-800/90"
              type="button"
              onClick={() => setIsMobileMenuOpen((value) => !value)}
            >
              {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>

          <button
            aria-label={isMobileFiltersOpen ? 'Close filters' : 'Open filters'}
            className="fixed bottom-5 left-5 z-[2600] flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-950/85 text-cyan-300 shadow-2xl backdrop-blur transition hover:bg-slate-800/90 lg:hidden"
            type="button"
            onClick={() => setIsMobileFiltersOpen((value) => !value)}
          >
            {isMobileFiltersOpen ? <CloseIcon /> : <FilterIcon />}
          </button>

          <div className="absolute right-4 top-4 z-[2501] hidden items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/70 px-3 py-2 shadow-2xl backdrop-blur lg:flex">
            {[
              ['/', 'Map', HomeIcon],
              ['/timeline', 'Timeline', TimelineIcon],
              ['/podcasts', 'Podcasts', PodcastsIcon],
              ['/notes', 'Notes', NotesIcon],
              ['/add-location', 'Add', AddIcon],
            ].map(([to, label, Icon]) => (
              <Link
                key={to}
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800/80 hover:text-white"
                to={to}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          <div className="h-full w-full">
            <Map
              places={filteredPlaces}
              activePlaceId={selectedPlace?.id}
              onSelectPlace={(place) => setSelectedPlace(place)}
            />
          </div>

          <div className="pointer-events-none absolute inset-0 z-[2502] hidden items-end justify-end p-6 lg:flex">
            <PlaceDrawer
              place={selectedPlace}
              onClose={() => setSelectedPlace(null)}
              onToggleVisited={handleToggleVisited}
            />
          </div>
        </section>
      </section>

      <div
        className={`fixed inset-0 z-[2800] bg-slate-950/70 backdrop-blur transition-opacity lg:hidden ${
          isMobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        role="presentation"
        onClick={() => setIsMobileMenuOpen(false)}
      />
      <aside
        className={`fixed left-0 top-0 z-[2801] flex h-full w-72 flex-col gap-5 border-r border-slate-800 bg-slate-950/95 p-5 text-slate-100 shadow-2xl transition-transform lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2">
          <MenuIcon className="h-4 w-4 text-cyan-300" />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/80">
            Menu
          </p>
        </div>

        <nav className="flex flex-col gap-2">
          {mobileLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-cyan-400/40 hover:text-white"
              to={to}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Icon className="h-5 w-5 text-cyan-300" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div
        className={`fixed inset-x-0 bottom-0 z-[2800] lg:hidden ${
          isMobileFiltersOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-hidden={!isMobileFiltersOpen}
      >
        <div
          className={`absolute inset-0 bg-slate-950/70 backdrop-blur transition-opacity ${
            isMobileFiltersOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMobileFiltersOpen(false)}
          role="presentation"
        />
        <div
          className={`absolute bottom-0 left-0 right-0 max-h-[82vh] rounded-t-3xl border-t border-slate-800 bg-slate-950/95 p-5 shadow-2xl transition-transform ${
            isMobileFiltersOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="mb-4 flex items-center gap-2">
            <FilterIcon className="h-4 w-4 text-cyan-300" />
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
              Filters
            </p>
          </div>

          <div className="space-y-4 overflow-auto pb-6">
            <TimelineSlider periods={periods} />

            <label className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <LayersIcon className="h-4 w-4 text-cyan-300" />
                Historical period
              </span>
              <select
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                value={selectedPeriodId}
                onChange={(event) => setSelectedPeriodId(event.target.value)}
              >
                <option value="all">All periods</option>
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-3">
              {filteredPlaces.map((place) => (
                <button
                  key={place.id}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-left shadow-lg shadow-black/10 transition hover:border-cyan-400/40"
                  type="button"
                  onClick={() => {
                    setSelectedPlace(place)
                    setIsMobileFiltersOpen(false)
                  }}
                >
                  <h3 className="text-base font-semibold text-white">{place.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{place.short_description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-x-0 bottom-0 z-[2800] lg:hidden ${selectedPlace ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!selectedPlace}
      >
        <div
          className={`absolute inset-0 bg-slate-950/70 backdrop-blur transition-opacity ${
            selectedPlace ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setSelectedPlace(null)}
          role="presentation"
        />
        <div
          className={`absolute bottom-0 left-0 right-0 max-h-[82vh] rounded-t-3xl border-t border-slate-800 bg-slate-950/95 p-5 shadow-2xl transition-transform ${
            selectedPlace ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
              Place details
            </p>
            <button
              aria-label="Close place details"
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-800 text-slate-200"
              type="button"
              onClick={() => setSelectedPlace(null)}
            >
              <CloseIcon />
            </button>
          </div>
          <div className="overflow-auto pb-6">
            <PlaceDrawer
              place={selectedPlace}
              onClose={() => setSelectedPlace(null)}
              onToggleVisited={handleToggleVisited}
            />
          </div>
        </div>
      </div>
    </main>
  )
}

export default HomeMap
