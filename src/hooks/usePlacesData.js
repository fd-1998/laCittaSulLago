import { useCallback, useEffect, useState } from 'react'
import { fetchHistoricalPeriods, fetchPlaces } from '../services/places'
import { useTimeline } from '../context/TimelineContext'

const toNumber = (value) => {
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const getYearsFromLayers = (places) => {
  const years = new Set()

  places.forEach((place) => {
    const layers = place?.place_historical_layers ?? []
    layers.forEach((layer) => {
      const startYear = toNumber(layer.start_year)
      const endYear = toNumber(layer.end_year)

      if (startYear != null) {
        years.add(startYear)
      }

      if (endYear != null) {
        years.add(endYear)
      }
    })
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

      const years = getYearsFromLayers(loadedPlaces)
      if (years.length > 0) {
        setYears(years)
      }
    } catch (loadError) {
      setError(loadError.message || 'Impossibile caricare i dati dei luoghi.')
    } finally {
      setLoading(false)
    }
  }, [setYears])

  useEffect(() => {
    void (async () => {
      await loadPlaces()
    })()
  }, [loadPlaces])

  return {
    places,
    setPlaces,
    periods,
    loading,
    error,
    reload: loadPlaces,
  }
}
