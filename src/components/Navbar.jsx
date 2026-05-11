import { NavLink } from 'react-router-dom'
import { useTimeline } from '../context/TimelineContext'

const linkBase =
  'rounded-full px-4 py-2 text-sm font-medium transition hover:bg-slate-800/80 hover:text-white'

function Navbar() {
  const { selectedYear, selectedLabel, formatTimelineYear } = useTimeline()

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/70 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <NavLink to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/20">
            GIS
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
              Lecco Story Map
            </p>
            <p className="text-xs text-slate-400">Historical and cultural storytelling</p>
          </div>
        </NavLink>

        <nav className="flex flex-wrap items-center justify-end gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300'}`
            }
          >
            Map
          </NavLink>
          <NavLink
            to="/timeline"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300'}`
            }
          >
            Timeline
          </NavLink>
          <NavLink
            to="/add"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300'}`
            }
          >
            Add Place
          </NavLink>

          <div className="ml-2 rounded-full border border-slate-800 bg-slate-900/90 px-4 py-2 text-right text-xs text-slate-300 shadow-sm">
            <p className="font-semibold text-white">{formatTimelineYear(selectedYear)}</p>
            <p className="text-slate-400">{selectedLabel}</p>
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Navbar
