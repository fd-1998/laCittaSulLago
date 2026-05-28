import { useEffect, useRef } from 'react'
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

function Map({ markers = [], onSelectPlace, activePlaceId }) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerLayerRef = useRef(L.layerGroup())

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) {
      return undefined
    }

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: 11,
      zoomControl: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    markerLayerRef.current.addTo(map)
    mapInstanceRef.current = map

    // ensure Leaflet recalculates container size after initial render
    setTimeout(() => {
      try {
        map.invalidateSize()
      } catch {
        // ignore
      }
    }, 0)

    // react to container/viewport resizes so the map stays full-bleed
    const debounceRef = { id: null }
    const scheduleInvalidate = () => {
      if (debounceRef.id) clearTimeout(debounceRef.id)
      // wait a frame and a short timeout so layout settles (handles CSS transitions)
      debounceRef.id = setTimeout(() => {
        requestAnimationFrame(() => {
          try {
            map.invalidateSize()
          } catch {
            // ignore
          }
        })
      }, 120)
    }

    const handleResize = scheduleInvalidate

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    // also observe element size changes (useful in mobile chrome ui changes)
    let ro = null
    if (window.ResizeObserver && mapContainerRef.current) {
      ro = new ResizeObserver(() => {
        scheduleInvalidate()
      })
      ro.observe(mapContainerRef.current)
    }

    return () => {
      map.remove()
      mapInstanceRef.current = null
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      if (ro) ro.disconnect()
      if (debounceRef.id) clearTimeout(debounceRef.id)
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current) {
      return
    }

    markerLayerRef.current.clearLayers()

    markers.forEach((markerData) => {
      const place = markerData?.place
      const layer = markerData?.layer
      if (!place || !layer) {
        return
      }

      if (place.latitude == null || place.longitude == null) {
        return
      }

      const period = layer.historical_periods
      const periodColor = layer.marker_color || period?.color || '#38bdf8'
      const isVisited = Boolean(place.visited)
      const allImages = place.place_historical_layers
        ?.flatMap((entry) => entry?.place_images ?? [])
        .filter(Boolean) ?? []
      const primaryImage = allImages.find((image) => image.is_primary)
      const displayImage =
        primaryImage?.thumbnail_url ||
        primaryImage?.image_url ||
        allImages[0]?.thumbnail_url ||
        allImages[0]?.image_url

      const tooltipHtml = `
        <div style="min-width: 220px; max-width: 280px; font-family: system-ui, sans-serif;">
          ${
            displayImage
              ? `<img src="${displayImage}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 12px; margin-bottom: 8px;" />`
              : ''
          }
          <h3 style="margin: 0 0 4px; font-size: 15px;">${place.canonical_name ?? 'Luogo senza titolo'}</h3>
          <p style="margin: 0 0 6px; font-size: 12px; color: #94a3b8;">${
            period?.name ?? 'Periodo storico'
          }</p>
          <p style="margin: 0; font-size: 12px; line-height: 1.45; color: #cbd5f5;">${
            (layer.short_description ?? '').slice(0, 120)
          }</p>
        </div>
      `

      const marker = L.circleMarker([place.latitude, place.longitude], {
        radius: activePlaceId === place.id ? 10 : 7,
        color: isVisited ? '#22d3ee' : periodColor,
        fillColor: isVisited ? '#22d3ee' : periodColor,
        fillOpacity: isVisited ? 0.75 : 0.6,
        weight: 2,
      })

      marker.on('click', () => onSelectPlace?.(place, layer))
      marker.bindTooltip(tooltipHtml, {
        direction: 'top',
        offset: [0, -8],
        opacity: 0.95,
        className: 'map-tooltip',
      })

      marker.addTo(markerLayerRef.current)
    })

    if (markers.length > 0) {
      const bounds = L.latLngBounds(
        markers
          .map((marker) => marker?.place)
          .filter((place) => place?.latitude != null && place?.longitude != null)
          .map((place) => [place.latitude, place.longitude]),
      )

      if (bounds.isValid()) {
        // ensure container size is up-to-date before fitting bounds
        try {
          mapInstanceRef.current.invalidateSize()
        } catch {
          // ignore
        }
        // small delay so invalidateSize can take effect
        setTimeout(() => mapInstanceRef.current.fitBounds(bounds.pad(0.2), { animate: false }), 50)
      }
    }
  }, [markers, activePlaceId, onSelectPlace])

  // full-bleed map: keep the container in-flow so it tracks parent size reliably
  return <div ref={mapContainerRef} className="h-full w-full min-h-[70vh]" />
}

export default Map
