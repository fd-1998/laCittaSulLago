import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTimeline } from '../context/TimelineContext'

const linkBase =
  'rounded-full px-4 py-2 text-sm font-medium transition hover:bg-slate-800/80 hover:text-white'

function Navbar() {
  const { selectedYear, selectedLabel, formatTimelineYear, timelineEnabled } = useTimeline()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/70 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <button
          aria-label="Open navigation menu"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/70 text-slate-100 transition hover:bg-slate-800/80 lg:hidden"
          type="button"
          onClick={() => setIsOpen(true)}
        >
          <span className="text-lg">☰</span>
        </button>

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

      <div
        className={`fixed inset-0 z-50 bg-slate-950/70 backdrop-blur transition-opacity lg:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        role="presentation"
        onClick={() => setIsOpen(false)}
      />
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-72 flex-col gap-6 border-r border-slate-800 bg-slate-950/95 p-6 text-slate-100 shadow-2xl transition-transform lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
            Menu
          </div>
          <button
            aria-label="Close navigation menu"
            className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-200"
            type="button"
            onClick={() => setIsOpen(false)}
          >
            Close
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300'}`
            }
            onClick={() => setIsOpen(false)}
          >
            Home / Map
          </NavLink>
          <NavLink
            to="/timeline"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300'}`
            }
            onClick={() => setIsOpen(false)}
          >
            Timeline
          </NavLink>
          <NavLink
            to="/podcasts"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300'}`
            }
            onClick={() => setIsOpen(false)}
          >
            Podcasts
          </NavLink>
          <NavLink
            to="/notes"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300'}`
            }
            onClick={() => setIsOpen(false)}
          >
            Notes
          </NavLink>
          <NavLink
            to="/add-location"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300'}`
            }
            onClick={() => setIsOpen(false)}
          >
            Add Location
          </NavLink>
        </nav>

        {timelineEnabled ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-xs">
            <p className="text-slate-400">Selected year</p>
            <p className="mt-1 text-base font-semibold text-white">
              {formatTimelineYear(selectedYear)}
            </p>
            <p className="text-slate-400">{selectedLabel}</p>
          </div>
        ) : null}
      </aside>
    </header>
  )
}

export default Navbar
