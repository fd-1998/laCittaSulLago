import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Map from '../components/Map'
import PlaceDrawer from '../components/PlaceDrawer'
import TimelineSlider from '../components/TimelineSlider'
import { getActiveLayersForPlace, getDefaultLayerForPlace, useTimeline } from '../context/TimelineContext'
import usePlacesData from '../hooks/usePlacesData'
import { useAuth } from '../context/AuthContext'
import { updatePlaceVisited } from '../services/places'

const itineraries = [
  {
    id: 'architecture',
    label: 'Itinerario architettonico',
    shortLabel: 'Architettura',
    icon: Building2,
  },
  {
    id: 'manzoni',
    label: 'Itinerario manzoniano',
    shortLabel: 'Manzoni',
    icon: Sparkles,
  },
]

function normalize(value) {
  return value?.toLocaleLowerCase('it-IT').trim() ?? ''
}

function ResultCover({ image }) {
  const [failed, setFailed] = useState(false)
  if (!image || failed) {
    return <span className="gis-result-placeholder"><MapPin /></span>
  }
  return <img src={image.thumbnail_url || image.image_url} alt="" onError={() => setFailed(true)} />
}

function HomeMap() {
  const { canEdit } = useAuth()
  const { selectedYear, timelineEnabled } = useTimeline()
  const { places, setPlaces, periods, loading, error, reload } = usePlacesData()
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [selectedLayerByPlaceId, setSelectedLayerByPlaceId] = useState({})
  const [selectedPeriodId, setSelectedPeriodId] = useState('all')
  const [selectedItinerary, setSelectedItinerary] = useState('all')
  const [query, setQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const resolvedPlaces = useMemo(() => places.map((place) => {
    const activeLayers = timelineEnabled
      ? getActiveLayersForPlace(place, selectedYear)
      : [getDefaultLayerForPlace(place)].filter(Boolean)
    if (!activeLayers.length) return null

    const selectedLayerId = selectedLayerByPlaceId[place.id]
    const activeLayer = activeLayers.find((layer) => layer.id === selectedLayerId) ?? activeLayers[0]
    return { place, activeLayers, activeLayer }
  }).filter(Boolean), [places, selectedLayerByPlaceId, selectedYear, timelineEnabled])

  const filteredPlaces = useMemo(() => {
    const normalizedQuery = normalize(query)
    const itinerary = itineraries.find((item) => item.id === selectedItinerary)

    return resolvedPlaces.filter(({ place, activeLayer, activeLayers }) => {
      if (selectedPeriodId !== 'all') {
        const periodMatches = activeLayers.some(
          (layer) => String(layer.historical_period_id) === String(selectedPeriodId),
        )
        if (!periodMatches) return false
      }

      if (itinerary) {
        const tagMatches = place.place_tags?.some(
          (entry) => normalize(entry.tags?.name) === normalize(itinerary.label),
        )
        if (!tagMatches) return false
      }

      if (normalizedQuery) {
        const haystack = [
          place.canonical_name,
          activeLayer.title,
          activeLayer.short_description,
          activeLayer.long_description,
        ].map(normalize).join(' ')
        if (!haystack.includes(normalizedQuery)) return false
      }

      return true
    })
  }, [query, resolvedPlaces, selectedItinerary, selectedPeriodId])

  const markers = useMemo(() => filteredPlaces.map((entry) => ({
    place: entry.place,
    layer: entry.activeLayer,
    activeLayers: entry.activeLayers,
  })), [filteredPlaces])

  const itineraryCounts = useMemo(() => Object.fromEntries(
    itineraries.map((itinerary) => [
      itinerary.id,
      resolvedPlaces.filter(({ place }) => place.place_tags?.some(
        (entry) => normalize(entry.tags?.name) === normalize(itinerary.label),
      )).length,
    ]),
  ), [resolvedPlaces])

  function selectPlace(place, layer) {
    setSelectedPlace(place)
    if (layer?.id) {
      setSelectedLayerByPlaceId((current) => ({ ...current, [place.id]: layer.id }))
    }
  }

  async function toggleVisited() {
    if (!selectedPlace) return
    const { data, error: updateError } = await updatePlaceVisited(selectedPlace.id, !selectedPlace.visited)
    if (updateError) return
    setPlaces((current) => current.map((place) => (
      place.id === data.id ? { ...place, visited: data.visited } : place
    )))
    setSelectedPlace((current) => current ? { ...current, visited: data.visited } : current)
  }

  const activeEntry = filteredPlaces.find(({ place }) => place.id === selectedPlace?.id)
    ?? resolvedPlaces.find(({ place }) => place.id === selectedPlace?.id)

  return (
    <main className="gis-app">
      <section className={`gis-sidebar ${sidebarOpen ? 'is-open' : 'is-closed'}`}>
        <div className="gis-sidebar-heading">
          <div>
            <span className="gis-kicker">Atlante interattivo</span>
            <h1>Esplora Lecco</h1>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen((current) => !current)}
            aria-label={sidebarOpen ? 'Chiudi pannello' : 'Apri pannello'}
          >
            {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
          </button>
        </div>

        <div className="gis-sidebar-content">
          <label className="gis-search">
            <Search aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cerca un luogo o una storia"
            />
            {query ? <button type="button" onClick={() => setQuery('')} aria-label="Cancella ricerca"><X /></button> : null}
          </label>

          <div className="gis-filter-group">
            <span className="gis-filter-label">Itinerari</span>
            <div className="gis-itinerary-grid">
              {itineraries.map(({ id, shortLabel, icon: Icon }) => (
                <button
                  key={id}
                  className={selectedItinerary === id ? 'is-active' : ''}
                  type="button"
                  onClick={() => setSelectedItinerary((current) => current === id ? 'all' : id)}
                >
                  <Icon />
                  <span>{shortLabel}</span>
                  <strong>{itineraryCounts[id]}</strong>
                </button>
              ))}
            </div>
          </div>

          <div className="gis-filter-group">
            <span className="gis-filter-label">Tempo e periodo</span>
            <TimelineSlider periods={periods} />
            <label className="gis-period-select">
              <span>Periodo storico</span>
              <select value={selectedPeriodId} onChange={(event) => setSelectedPeriodId(event.target.value)}>
                <option value="all">Tutti i periodi</option>
                {periods.map((period) => <option key={period.id} value={period.id}>{period.name}</option>)}
              </select>
            </label>
          </div>

          <div className="gis-results-heading">
            <span>{filteredPlaces.length} luoghi</span>
            {(selectedItinerary !== 'all' || selectedPeriodId !== 'all' || query) ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setSelectedItinerary('all')
                  setSelectedPeriodId('all')
                }}
              >
                Azzera filtri
              </button>
            ) : null}
          </div>

          <div className="gis-results">
            {loading ? <div className="gis-status">Caricamento dei luoghi…</div> : null}
            {error ? (
              <div className="gis-status is-error">
                <span>{error}</span>
                <button type="button" onClick={reload}>Riprova</button>
              </div>
            ) : null}
            {!loading && !error && !filteredPlaces.length ? (
              <div className="gis-status">
                Nessun luogo corrisponde ai filtri. Gli itinerari possono essere assegnati dalla scheda di modifica.
              </div>
            ) : null}
            {filteredPlaces.map(({ place, activeLayer }) => {
              const cover = activeLayer.place_images?.find((image) => image.is_primary)
                ?? activeLayer.place_images?.[0]
              return (
                <button
                  key={place.id}
                  className={`gis-result-card ${selectedPlace?.id === place.id ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => selectPlace(place, activeLayer)}
                >
                  <ResultCover image={cover} />
                  <span>
                    <strong>{activeLayer.title || place.canonical_name}</strong>
                    <small>{place.canonical_name}</small>
                  </span>
                  {place.visited ? <Check className="gis-result-visited" /> : null}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="gis-map-stage">
        <Map
          markers={markers}
          activePlaceId={selectedPlace?.id}
          onSelectPlace={selectPlace}
        />

        <div className="gis-map-badge">
          <MapPin />
          <span><strong>{filteredPlaces.length}</strong> luoghi sulla mappa</span>
        </div>

        <button className="gis-mobile-filter-button" type="button" onClick={() => setMobileFiltersOpen(true)}>
          <Filter /> Filtri
          {(selectedItinerary !== 'all' || selectedPeriodId !== 'all') ? <span /> : null}
        </button>

        {canEdit ? (
          <Link className="gis-add-button" to="/add-location">
            <Plus /> <span>Aggiungi luogo</span>
          </Link>
        ) : null}

        {selectedPlace ? (
          <>
            <button
              className="gis-panel-backdrop"
              type="button"
              aria-label="Chiudi scheda luogo"
              onClick={() => setSelectedPlace(null)}
            />
            <PlaceDrawer
              key={selectedPlace.id}
              place={selectedPlace}
              activeLayer={activeEntry?.activeLayer}
              periods={periods}
              onSelectLayer={(layer) => selectPlace(selectedPlace, layer)}
              onClose={() => setSelectedPlace(null)}
              onToggleVisited={toggleVisited}
              onPlaceUpdated={(updated) => {
                setPlaces((current) => current.map((place) => place.id === updated.id ? updated : place))
                setSelectedPlace(updated)
              }}
            />
          </>
        ) : null}
      </section>

      <div className={`gis-mobile-sheet ${mobileFiltersOpen ? 'is-open' : ''}`}>
        <button className="gis-mobile-sheet-backdrop" type="button" onClick={() => setMobileFiltersOpen(false)} aria-label="Chiudi filtri" />
        <div>
          <header><h2>Filtra la mappa</h2><button type="button" onClick={() => setMobileFiltersOpen(false)}><X /></button></header>
          <span className="gis-filter-label">Itinerari</span>
          <div className="gis-itinerary-grid">
            {itineraries.map(({ id, shortLabel, icon: Icon }) => (
              <button
                key={id}
                className={selectedItinerary === id ? 'is-active' : ''}
                type="button"
                onClick={() => setSelectedItinerary((current) => current === id ? 'all' : id)}
              >
                <Icon /><span>{shortLabel}</span><strong>{itineraryCounts[id]}</strong>
              </button>
            ))}
          </div>
          <TimelineSlider periods={periods} />
          <label className="gis-period-select">
            <span>Periodo storico</span>
            <select value={selectedPeriodId} onChange={(event) => setSelectedPeriodId(event.target.value)}>
              <option value="all">Tutti i periodi</option>
              {periods.map((period) => <option key={period.id} value={period.id}>{period.name}</option>)}
            </select>
          </label>
          <button className="gis-apply-button" type="button" onClick={() => setMobileFiltersOpen(false)}>
            Mostra {filteredPlaces.length} luoghi
          </button>
        </div>
      </div>
    </main>
  )
}

export default HomeMap
