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
  LayersIcon,
  NotesIcon,
  PodcastsIcon,
  TimelineIcon,
} from '../components/UiIcons'
import { getActiveLayersForPlace, getDefaultLayerForPlace, useTimeline } from '../context/TimelineContext'
import usePlacesData from '../hooks/usePlacesData'
import { updatePlaceVisited } from '../services/places'
import SiteLogo from '../assets/logo.png'


function HomeMap() {
  const { selectedYear, timelineEnabled } = useTimeline()
  const { places, setPlaces, periods, loading, error } = usePlacesData()
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [selectedLayerByPlaceId, setSelectedLayerByPlaceId] = useState({})
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

  const resolvedPlaces = useMemo(() => {
    return places
      .map((place) => {
        const activeLayers = timelineEnabled
          ? getActiveLayersForPlace(place, selectedYear)
          : [getDefaultLayerForPlace(place)].filter(Boolean)

        if (!activeLayers.length) {
          return null
        }

        const selectedLayerId = selectedLayerByPlaceId[place.id]
        const activeLayer =
          activeLayers.find((layer) => layer.id === selectedLayerId) ?? activeLayers[0]

        return {
          place,
          activeLayers,
          activeLayer,
        }
      })
      .filter(Boolean)
  }, [places, selectedYear, selectedLayerByPlaceId, timelineEnabled])

  const filteredPlaces = useMemo(() => {
    return resolvedPlaces.filter(({ activeLayers, activeLayer }) => {
      if (selectedPeriodId === 'all') {
        return true
      }

      const periodId = String(selectedPeriodId)
      return (
        activeLayer?.historical_period_id != null &&
        String(activeLayer.historical_period_id) === periodId
      ) || activeLayers.some((layer) => String(layer.historical_period_id) === periodId)
    })
  }, [resolvedPlaces, selectedPeriodId])

  const markers = useMemo(
    () =>
      filteredPlaces.map((entry) => ({
        place: entry.place,
        layer: entry.activeLayer,
        activeLayers: entry.activeLayers,
      })),
    [filteredPlaces],
  )

  useEffect(() => {
    if (!selectedPlace) {
      return
    }

    const stillVisible = filteredPlaces.some((entry) => entry.place.id === selectedPlace.id)
    if (!stillVisible) {
      setSelectedPlace(null)
    }
  }, [filteredPlaces, selectedPlace])

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
    <main className="relative h-[calc(100dvh-4.5rem)] w-screen overflow-hidden bg-slate-950 pt-[0]">
      <section
        className={`grid h-full w-full grid-cols-1 lg:transition-[grid-template-columns] ${
          isDesktopFiltersOpen
            ? 'lg:grid-cols-[24rem_minmax(0,1fr)]'
            : 'lg:grid-cols-[4.75rem_minmax(0,1fr)]'
        }`}
      >
        <aside className="relative z-[2500] hidden h-full flex-col border-r border-slate-800/80 bg-slate-950/80 backdrop-blur lg:flex">
          

          <div className="relative flex-1 overflow-hidden px-5 py-5">

            {isDesktopFiltersOpen ? (
              <div className="flex h-full min-h-0 flex-col gap-4">
                <div className="rounded-3xl border border-slate-800/80 bg-slate-950/70 p-4 shadow-lg">

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                      <FilterIcon />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Filtri</p>
                    </div>
                  </div>
                    
                  <TimelineSlider periods={periods} />

                  <label className="space-y-2 rounded-3xl border border-slate-800/80 bg-slate-950/70 p-4 shadow-lg">
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
                      <LayersIcon className="h-4 w-4 text-cyan-300" />
                      Periodo storico
                    </span>
                    <select
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                      value={selectedPeriodId}
                      onChange={(event) => setSelectedPeriodId(event.target.value)}
                    >
                      <option value="all">Tutti i periodi</option>
                      {periods.map((period) => (
                        <option key={period.id} value={period.id}>
                          {period.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
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
          {/* Mobile menu is now a shared component mounted in App */}

          {/* <div className="absolute flex flex-row items-center gap-3 right-4 top-4 z-[2500] max-w-[min(18rem,calc(100vw-6rem))] rounded-3xl border border-slate-800/80 bg-slate-950/70 px-4 py-3 shadow-2xl backdrop-blur lg:hidden text-right">
            <div className="flex-shrink-0">
              <img src={SiteLogo} alt="Logo" className="h-10 w-10 rounded-md object-cover" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/80">La Città sul Lago</p>
              <h2 className="mt-1 text-xs text-white">Atlante storico di Lecco</h2>
            </div>
          </div> */}

          <button
            aria-label="Apri filtri"
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[2600] flex h-12 items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/85 px-6 text-cyan-300 shadow-2xl backdrop-blur transition hover:bg-slate-800/90 lg:hidden ${
              isMobileFiltersOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
            type="button"
            onClick={() => setIsMobileFiltersOpen(true)}
          >
            <FilterIcon className="h-5 w-5" />
            <span className="text-sm font-semibold tracking-wide">Filtri</span>
          </button>
{/* 
          <div className="absolute right-4 top-4 z-[2501] hidden items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/70 px-3 py-2 shadow-2xl backdrop-blur lg:flex">
            {[
              ['/', 'Mappa', HomeIcon],
              ['/timeline', 'Cronologia', TimelineIcon],
              ['/podcasts', 'Podcast', PodcastsIcon],
              ['/notes', 'Note', NotesIcon],
              ['/add-location', 'Aggiungi', AddIcon],
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
          </div> */}

          <div className="h-full w-full">
            <Map
              markers={markers}
              activePlaceId={selectedPlace?.id}
              onSelectPlace={(place, layer) => {
                setSelectedPlace(place)
                if (layer?.id) {
                  setSelectedLayerByPlaceId((current) => ({
                    ...current,
                    [place.id]: layer.id,
                  }))
                }
              }}
            />
          </div>

          <div className="pointer-events-none absolute inset-0 z-[2502] hidden items-end justify-end p-6 lg:flex">
            <PlaceDrawer
              place={selectedPlace}
              activeLayer={
                filteredPlaces.find((entry) => entry.place.id === selectedPlace?.id)?.activeLayer
              }
              activeLayers={
                filteredPlaces.find((entry) => entry.place.id === selectedPlace?.id)?.activeLayers ??
                []
              }
              onSelectLayer={(layer) => {
                if (layer?.id && selectedPlace?.id) {
                  setSelectedLayerByPlaceId((current) => ({
                    ...current,
                    [selectedPlace.id]: layer.id,
                  }))
                }
              }}
              onClose={() => setSelectedPlace(null)}
              onToggleVisited={handleToggleVisited}
            />
          </div>
        </section>
      </section>

      {/* Mobile menu is now a shared component mounted in App */}

      <div
        className={`fixed inset-x-0 bottom-0 z-[2800] lg:hidden ${
          isMobileFiltersOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-hidden={!isMobileFiltersOpen}
      >
        <div
          className={`absolute inset-0 bg-slate-950 backdrop-blur transition-opacity ${
            isMobileFiltersOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMobileFiltersOpen(false)}
          role="presentation"
        />
        <div
          className={`absolute bottom-0 left-0 right-0 flex max-h-[82vh] flex-col overflow-hidden rounded-t-3xl border-t border-slate-800 bg-slate-950/95 p-5 shadow-2xl transition-transform ${
            isMobileFiltersOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
            <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4 text-cyan-300" />
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
                Filtri
              </p>
            </div>
            <button
              aria-label="Chiudi filtri"
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-800 text-slate-200 transition hover:border-cyan-400/40 hover:text-white"
              type="button"
              onClick={() => setIsMobileFiltersOpen(false)}
            >
              <CloseIcon />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden overscroll-contain pb-6">
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
              {filteredPlaces.map(({ place, activeLayer }) => (
                <button
                  key={place.id}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-left shadow-lg shadow-black/10 transition hover:border-cyan-400/40"
                  type="button"
                  onClick={() => {
                    setSelectedPlace(place)
                    if (activeLayer?.id) {
                      setSelectedLayerByPlaceId((current) => ({
                        ...current,
                        [place.id]: activeLayer.id,
                      }))
                    }
                    setIsMobileFiltersOpen(false)
                  }}
                >
                  <h3 className="text-base font-semibold text-white">
                    {activeLayer?.title ?? place.canonical_name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">
                    {activeLayer?.short_description}
                  </p>
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
          className={`absolute bottom-0 left-0 right-0 flex max-h-[82vh] flex-col rounded-t-3xl border-t border-slate-800 bg-slate-950/95 p-5 shadow-2xl transition-transform ${
            selectedPlace ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">
            <PlaceDrawer
              place={selectedPlace}
              activeLayer={
                filteredPlaces.find((entry) => entry.place.id === selectedPlace?.id)?.activeLayer
              }
              activeLayers={
                filteredPlaces.find((entry) => entry.place.id === selectedPlace?.id)?.activeLayers ??
                []
              }
              onSelectLayer={(layer) => {
                if (layer?.id && selectedPlace?.id) {
                  setSelectedLayerByPlaceId((current) => ({
                    ...current,
                    [selectedPlace.id]: layer.id,
                  }))
                }
              }}
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
