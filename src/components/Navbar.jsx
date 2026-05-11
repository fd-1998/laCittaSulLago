import { NavLink } from 'react-router-dom'
import { useTimeline } from '../context/TimelineContext'

const linkBase =
  'rounded-full px-4 py-2 text-sm font-medium transition hover:bg-slate-800/80 hover:text-white'

function Navbar({ variant = 'sticky' }) {
  const { selectedYear, selectedLabel, formatTimelineYear, timelineEnabled } = useTimeline()

  if (variant === 'overlay') {
    // overlay variant is unused; render nothing special here because MobileMenu is mounted globally
    return null
  }

  return (
    <header className="sticky top-0 z-[3000] border-b border-slate-800/70 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        {/* Mobile menu button moved to shared MobileMenu component */}

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

        <nav className="hidden flex-wrap items-center justify-end gap-2 lg:flex">
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
            to="/podcasts"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300'}`
            }
          >
            Podcasts
          </NavLink>
          <NavLink
            to="/notes"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300'}`
            }
          >
            Notes
          </NavLink>
          <NavLink
            to="/add-location"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300'}`
            }
          >
            Add Place
          </NavLink>

          {timelineEnabled ? (
            <div className="ml-2 rounded-full border border-slate-800 bg-slate-900/90 px-4 py-2 text-right text-xs text-slate-300 shadow-sm">
              <p className="font-semibold text-white">{formatTimelineYear(selectedYear)}</p>
              <p className="text-slate-400">{selectedLabel}</p>
            </div>
          ) : null}
        </nav>
      </div>

      {/* mobile menu is handled by shared MobileMenu component mounted in App */}
    </header>
  )
}

export default Navbar
