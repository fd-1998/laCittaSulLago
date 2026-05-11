import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import marker2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const DEFAULT_CENTER = [45.856, 9.391]

function Map({ places = [], selectedYear }) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerLayerRef = useRef(L.layerGroup())

  const visiblePlaces = useMemo(() => {
    return places.filter((place) => {
      const startYear = Number(place.start_year)
      const endYear = Number(place.end_year)

      return (
        !Number.isNaN(startYear) &&
        !Number.isNaN(endYear) &&
        startYear <= selectedYear &&
        selectedYear <= endYear
      )
    })
  }, [places, selectedYear])

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) {
      return undefined
    }

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: 11,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    markerLayerRef.current.addTo(map)
    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current) {
      return
    }

    markerLayerRef.current.clearLayers()

    visiblePlaces.forEach((place) => {
      if (place.latitude == null || place.longitude == null) {
        return
      }

      const popupHtml = `
        <div style="min-width: 220px; max-width: 280px; font-family: system-ui, sans-serif;">
          <h3 style="margin: 0 0 4px; font-size: 16px;">${place.title ?? 'Untitled place'}</h3>
          <p style="margin: 0 0 6px; font-size: 12px; color: #64748b;">${place.period_label ?? 'Historical location'}</p>
          <p style="margin: 0 0 10px; font-size: 13px; line-height: 1.45;">${(place.description ?? '').slice(0, 140)}</p>
          <a href="/place/${place.id}" style="color: #0f766e; font-weight: 600; text-decoration: none;">Open details →</a>
        </div>
      `

      L.marker([place.latitude, place.longitude])
        .bindPopup(popupHtml, { maxWidth: 320 })
        .addTo(markerLayerRef.current)
    })

    if (visiblePlaces.length > 0) {
      const bounds = L.latLngBounds(
        visiblePlaces
          .filter((place) => place.latitude != null && place.longitude != null)
          .map((place) => [place.latitude, place.longitude]),
      )

      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds.pad(0.2), { animate: false })
      }
    }
  }, [visiblePlaces])

  return <div ref={mapContainerRef} className="h-full min-h-[70vh] w-full rounded-3xl" />
}

export default Map
