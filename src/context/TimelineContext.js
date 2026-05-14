import { createContext, createElement, useContext, useMemo, useState } from 'react'

const TimelineContext = createContext(null)

export const YEAR_MIN = -60000
export const YEAR_MAX = new Date().getFullYear()

const periodBands = [
  { min: -60000, max: -3000, label: 'Paleolithic' },
  { min: -2999, max: -501, label: 'Pre-Roman' },
  { min: -500, max: 476, label: 'Roman / Late Antiquity' },
  { min: 477, max: 1499, label: 'Medieval' },
  { min: 1500, max: 1799, label: 'Early Modern' },
  { min: 1800, max: 1945, label: 'Modern' },
  { min: 1946, max: YEAR_MAX, label: 'Contemporary' },
]

export function formatTimelineYear(year) {
  if (year < 0) {
    return `${Math.abs(year).toLocaleString()} BCE`
  }

  return `${year} CE`
}

export function getTimelineLabel(year) {
  return periodBands.find((band) => year >= band.min && year <= band.max)?.label ?? 'Historical'
}

export function isLayerVisibleAtYear(layer, year) {
  if (!layer) {
    return false
  }

  const startYear = Number(layer.start_year)
  const endYear = Number(layer.end_year)

  if (Number.isNaN(startYear) || Number.isNaN(endYear)) {
    return false
  }

  return startYear <= year && year <= endYear
}

export function getActiveLayersForPlace(place, year) {
  const layers = place?.place_historical_layers ?? []
  return layers
    .filter((layer) => isLayerVisibleAtYear(layer, year))
    .sort((a, b) => Number(b.start_year) - Number(a.start_year))
}

export function getDefaultLayerForPlace(place) {
  const layers = place?.place_historical_layers ?? []
  return layers
    .slice()
    .sort((a, b) => Number(b.start_year) - Number(a.start_year))
    .find(Boolean) ?? null
}

export function TimelineProvider({ children }) {
  const [years, setYears] = useState([YEAR_MAX])
  const [selectedYearIndexState, setSelectedYearIndex] = useState(0)
  const [timelineEnabled, setTimelineEnabled] = useState(false)
  const selectedYearIndex = useMemo(() => {
    if (years.length === 0) {
      return 0
    }

    return Math.min(Math.max(selectedYearIndexState, 0), years.length - 1)
  }, [selectedYearIndexState, years])

  const selectedYear = years[selectedYearIndex] ?? years[years.length - 1] ?? YEAR_MAX

  const value = useMemo(
    () => ({
      years,
      setYears,
      selectedYear,
      selectedYearIndex,
      setSelectedYearIndex,
      timelineEnabled,
      setTimelineEnabled,
      selectedLabel: getTimelineLabel(selectedYear),
      formatTimelineYear,
    }),
    [selectedYear, selectedYearIndex, timelineEnabled, years],
  )

  return createElement(TimelineContext.Provider, { value }, children)
}

export function useTimeline() {
  const context = useContext(TimelineContext)

  if (!context) {
    throw new Error('useTimeline must be used within a TimelineProvider')
  }

  return context
}
