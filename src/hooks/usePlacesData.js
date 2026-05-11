import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchHistoricalPeriods, fetchPlaces } from '../services/places'
import { useTimeline } from '../context/TimelineContext'

const toNumber = (value) => {
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const getYearsFromPlaces = (places) => {
  const years = new Set()

  places.forEach((place) => {
    const startYear = toNumber(place.start_year)
    const endYear = toNumber(place.end_year)

    if (startYear != null) {
      years.add(startYear)
    }

    if (endYear != null) {
      years.add(endYear)
    }
  })

  return Array.from(years).sort((a, b) => a - b)
}

export default function usePlacesData() {
  const { setYears } = useTimeline()
  const [places, setPlaces] = useState([])
  const [periods, setPeriods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadPlaces = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [placesResponse, periodsResponse] = await Promise.all([
        fetchPlaces(),
        fetchHistoricalPeriods(),
      ])

      if (placesResponse.error) {
        throw placesResponse.error
      }

      if (periodsResponse.error) {
        throw periodsResponse.error
      }

      const loadedPlaces = placesResponse.data ?? []
      const loadedPeriods = periodsResponse.data ?? []

      setPlaces(loadedPlaces)
      setPeriods(loadedPeriods)

      const years = getYearsFromPlaces(loadedPlaces)
      if (years.length > 0) {
        setYears(years)
      }
    } catch (loadError) {
      setError(loadError.message || 'Unable to load places data.')
    } finally {
      setLoading(false)
    }
  }, [setYears])

  useEffect(() => {
    loadPlaces()
  }, [loadPlaces])

  const primaryImages = useMemo(() => {
    const imageMap = new Map()

    places.forEach((place) => {
      const images = place.place_images ?? []
      const primary = images.find((image) => image.is_primary) ?? images[0]
      if (primary) {
        imageMap.set(place.id, primary)
      }
    })

    return imageMap
  }, [places])

  return {
    places,
    setPlaces,
    periods,
    primaryImages,
    loading,
    error,
    reload: loadPlaces,
  }
}
