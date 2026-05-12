import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const DEFAULT_CENTER = [45.856, 9.391]

function CoordinatePicker({ value, onChange }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
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

    map.on('click', (event) => {
      const { lat, lng } = event.latlng
      onChangeRef.current?.({ latitude: lat, longitude: lng })
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [onChange])

  useEffect(() => {
    if (!mapRef.current || value?.latitude == null || value?.longitude == null) {
      return
    }

    if (!markerRef.current) {
      markerRef.current = L.marker([value.latitude, value.longitude]).addTo(mapRef.current)
      mapRef.current.setView([value.latitude, value.longitude], 13, { animate: true })
    } else {
      markerRef.current.setLatLng([value.latitude, value.longitude])
      mapRef.current.panTo([value.latitude, value.longitude], { animate: true })
    }
  }, [value])

  return <div ref={mapContainerRef} className="h-56 w-full rounded-2xl" />
}

export default CoordinatePicker
