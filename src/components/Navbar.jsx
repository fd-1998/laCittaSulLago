import { NavLink } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useTimeline } from '../context/TimelineContext'
import { useAuth } from '../context/AuthContext'
import { podcastShows } from '../frontpage/siteConfig'

const linkBase =
  'rounded-full px-4 py-2 text-sm font-medium transition hover:bg-slate-800/80 hover:text-white'

function Navbar({ variant = 'sticky' }) {
  const { selectedYear, selectedLabel, formatTimelineYear, timelineEnabled } = useTimeline()
  const { user, canEdit, isAdmin, logout } = useAuth()

  if (variant === 'overlay') {
    // overlay variant is unused; render nothing special here because MobileMenu is mounted globally
    return null
  }

  return (
    <header className="sticky top-0 z-[3000] border-b border-slate-800/70 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        {/* Mobile menu button moved to shared MobileMenu component */}

        <NavLink to="/" className="flex items-center gap-3">

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
              La Città sul Lago
            </p>
            <p className="text-xs text-slate-400">Atlante storico di Lecco</p>
          </div>
        </NavLink>

        <nav className="hidden flex-wrap items-center justify-end gap-2 lg:flex">
          <NavLink
            to="/mappa"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300'}`
            }
          >
            Mappa
          </NavLink>
          {/* <NavLink
            to="/timeline"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300'}`
            }
          >
            Cronologia
          </NavLink> */}
          <div className="group relative">
            <NavLink
              to="/podcasts"
              className={({ isActive }) =>
                `${linkBase} flex items-center gap-1 ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300'}`
              }
            >
              Podcasts <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </NavLink>
            <div className="invisible absolute left-1/2 top-full z-10 w-64 -translate-x-1/2 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/95 p-2 shadow-2xl">
                {podcastShows.map((show) => (
                  <NavLink
                    key={show.slug}
                    to={`/podcasts/${show.slug}`}
                    className="block rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800/80 hover:text-white"
                  >
                    {show.shortTitle || show.title}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
          {/* <NavLink
            to="/notes"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300'}`
            }
          >
            Note
          </NavLink> */}
          {canEdit ? (
            <NavLink
              to="/database"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300'}`
              }
            >
              Database
            </NavLink>
          ) : null}
          {isAdmin ? (
            <>
              <NavLink
                to="/admin/podcasts"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300'}`
                }
              >
                Gestione podcast
              </NavLink>
              <NavLink
                to="/admin/users"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300'}`
                }
              >
                Collaboratori
              </NavLink>
            </>
          ) : null}
          {user ? (
            <>
              <NavLink
                to="/account"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300'}`
                }
              >
                {user.username}
              </NavLink>
              <button type="button" className={`${linkBase} text-slate-300`} onClick={logout}>
                Esci
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300'}`
              }
            >
              Accedi
            </NavLink>
          )}
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
