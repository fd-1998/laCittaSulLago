import { useTimeline } from '../context/TimelineContext'

function TimelineSlider() {
  const { selectedYear, setSelectedYear, yearRange, selectedLabel, formatTimelineYear } = useTimeline()

  return (
    <div className="panel">
      <div className="panel-header flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
            Timeline
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">Browse by year</h2>
        </div>
        <div className="rounded-2xl bg-cyan-400/10 px-4 py-2 text-right">
          <p className="text-sm font-semibold text-cyan-200">{formatTimelineYear(selectedYear)}</p>
          <p className="text-xs text-cyan-100/70">{selectedLabel}</p>
        </div>
      </div>

      <div className="panel-body space-y-4">
        <input
          aria-label="Timeline year"
          className="timeline-slider h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-cyan-400"
          min={yearRange.min}
          max={yearRange.max}
          step="1"
          type="range"
          value={selectedYear}
          onChange={(event) => setSelectedYear(Number(event.target.value))}
        />

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{formatTimelineYear(yearRange.min)}</span>
          <span>{formatTimelineYear(yearRange.max)}</span>
        </div>
      </div>
    </div>
  )
}

export default TimelineSlider
