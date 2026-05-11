import { createContext, createElement, useContext, useMemo, useState } from 'react'

const TimelineContext = createContext(null)

export const YEAR_MIN = -60000
export const YEAR_MAX = 2026

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

export function isPlaceVisibleAtYear(place, year) {
  if (!place) {
    return false
  }

  const startYear = Number(place.start_year)
  const endYear = Number(place.end_year)

  if (Number.isNaN(startYear) || Number.isNaN(endYear)) {
    return false
  }

  return startYear <= year && year <= endYear
}

export function filterPlacesByYear(places, year) {
  return places.filter((place) => isPlaceVisibleAtYear(place, year))
}

export function TimelineProvider({ children }) {
  const [selectedYear, setSelectedYear] = useState(YEAR_MAX)

  const value = useMemo(
    () => ({
      selectedYear,
      setSelectedYear,
      yearRange: { min: YEAR_MIN, max: YEAR_MAX },
      selectedLabel: getTimelineLabel(selectedYear),
      formatTimelineYear,
    }),
    [selectedYear],
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
