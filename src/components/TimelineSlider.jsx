import { useMemo } from 'react'
import { useTimeline } from '../context/TimelineContext'

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
      <div className="panel">
        <div className="panel-header">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
            Timeline
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">Timeline disabled</h2>
        </div>
        <div className="panel-body space-y-3">
          <p className="text-sm text-slate-300">
            Enable the historical timeline to snap between years that exist in the database.
          </p>
          <button
            className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            type="button"
            onClick={() => setTimelineEnabled(true)}
          >
            Enable timeline
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="panel-header flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
            Timeline
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">Browse by historical year</h2>
        </div>
        <div className="rounded-2xl bg-cyan-400/10 px-4 py-2 text-right">
          <p className="text-sm font-semibold text-cyan-200">{formatTimelineYear(selectedYear)}</p>
          <p className="text-xs text-cyan-100/70">{label || 'Historical period'}</p>
        </div>
      </div>

      <div className="panel-body space-y-4">
        <input
          aria-label="Timeline year"
          className="timeline-slider h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-cyan-400"
          min={0}
          max={Math.max(years.length - 1, 0)}
          step="1"
          type="range"
          value={selectedYearIndex}
          onChange={(event) => setSelectedYearIndex(Number(event.target.value))}
        />

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{formatTimelineYear(years[0] ?? selectedYear)}</span>
          <button
            className="text-xs text-slate-400 transition hover:text-slate-200"
            type="button"
            onClick={() => setTimelineEnabled(false)}
          >
            Disable
          </button>
          <span>{formatTimelineYear(years[years.length - 1] ?? selectedYear)}</span>
        </div>
      </div>
    </div>
  )
}

export default TimelineSlider
