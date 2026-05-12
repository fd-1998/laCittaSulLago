import { useMemo } from 'react'
import { useTimeline } from '../context/TimelineContext'
import { FilterIcon, TimelineIcon } from './UiIcons'

function TimelineSlider({ periods = [] }) {
  const {
    years,
    selectedYear,
    selectedYearIndex,
    setSelectedYearIndex,
    timelineEnabled,
    setTimelineEnabled,
    formatTimelineYear,
  } = useTimeline()

  const label = useMemo(() => {
    if (!periods.length) {
      return ''
    }

    return periods.find(
      (period) => selectedYear >= period.start_year && selectedYear <= period.end_year,
    )?.name
  }, [periods, selectedYear])

  if (!timelineEnabled) {
    return (
      <button
        className="flex w-full items-center justify-between gap-3 rounded-3xl border border-slate-800/80 bg-slate-950/70 px-4 py-4 text-left shadow-lg transition hover:border-cyan-400/40 hover:bg-slate-900/80"
        type="button"
        onClick={() => setTimelineEnabled(true)}
      >
          <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
            <TimelineIcon />
          </span>
          <span>
            <span className="block text-sm font-semibold text-white">Cronologia</span>
            <span className="block text-xs text-slate-400">Tocca per attivare</span>
          </span>
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400 text-slate-950">
          <FilterIcon />
        </span>
      </button>
    )
  }

  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-950/70 p-4 shadow-lg">
      <button
        className="mb-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-left transition hover:border-cyan-400/40"
        type="button"
        onClick={() => setTimelineEnabled(false)}
      >
          <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
            <TimelineIcon />
          </span>
          <span>
            <span className="block text-sm font-semibold text-white">{formatTimelineYear(selectedYear)}</span>
            <span className="block text-xs text-slate-400">{label || 'Periodo storico'}</span>
          </span>
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 text-slate-300">
          <FilterIcon />
        </span>
      </button>

      <input
        aria-label="Anno cronologia"
        className="timeline-slider h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-cyan-400"
        min={0}
        max={Math.max(years.length - 1, 0)}
        step="1"
        type="range"
        value={selectedYearIndex}
        onChange={(event) => setSelectedYearIndex(Number(event.target.value))}
      />

      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>{formatTimelineYear(years[0] ?? selectedYear)}</span>
        <span>{formatTimelineYear(years[years.length - 1] ?? selectedYear)}</span>
      </div>
    </div>
  )
}

export default TimelineSlider
