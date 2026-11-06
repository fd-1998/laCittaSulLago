import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePodcastCatalog } from '../hooks/usePodcastsData'
import {
  AddIcon,
  HomeIcon,
  NotesIcon,
  PodcastsIcon,
  TimelineIcon,
  DatabaseIcon,
  MenuIcon,
  CloseIcon,
} from './UiIcons'

const publicLinks = [
  { to: '/mappa', label: 'Mappa', icon: HomeIcon },
  { to: '/timeline', label: 'Cronologia', icon: TimelineIcon },
  { to: '/podcasts', label: 'Podcast', icon: PodcastsIcon },
  { to: '/notes', label: 'Note', icon: NotesIcon },
]

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, canEdit, isAdmin, logout } = useAuth()
  const { podcasts } = usePodcastCatalog()
  const mobileLinks = [
    ...publicLinks,
    ...(canEdit ? [
      { to: '/database', label: 'Database', icon: DatabaseIcon },
      { to: '/add-location', label: 'Aggiungi', icon: AddIcon },
    ] : []),
    ...(isAdmin ? [{ to: '/admin/users', label: 'Collaboratori', icon: DatabaseIcon }] : []),
    ...(isAdmin ? [{ to: '/admin/podcasts', label: 'Gestione podcast', icon: PodcastsIcon }] : []),
  ]

  return (
    <>
      <div className="fixed right-4 top-4 z-[99997] flex items-center gap-2 lg:hidden">
        <button
          aria-label={isOpen ? 'Chiudi menu' : 'Apri menu'}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-950/80 text-slate-100 shadow-2xl backdrop-blur transition hover:bg-slate-800/90"
          type="button"
          onClick={() => setIsOpen((v) => !v)}
        >
          {isOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      <div
        className={`fixed inset-0 z-[99998] bg-slate-950 backdrop-blur transition-opacity lg:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        role="presentation"
        onClick={() => setIsOpen(false)}
      />

      <aside
        className={`fixed right-0 top-0 z-[99999] flex h-full w-72 flex-col gap-5 border-l border-slate-800 bg-slate-950 p-5 text-slate-100 shadow-2xl transition-transform lg:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/80">Menu</div>
        </div>

        <nav className="flex flex-col gap-2">
          {mobileLinks.map(({ to, label, icon: Icon }) => (
            <div key={to}>
              <Link
                to={to}
                className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-cyan-400/40 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <Icon className="h-5 w-5 text-cyan-300" />
                <span>{label}</span>
              </Link>
              {to === '/podcasts' ? (
                <div className="ml-6 mt-1 flex flex-col gap-1">
                  {podcasts.map((show) => (
                    <Link
                      key={show.slug}
                      to={`/podcasts/${show.slug}`}
                      className="rounded-xl px-4 py-2 text-xs font-medium text-slate-300"
                      onClick={() => setIsOpen(false)}
                    >
                      {show.shortTitle || show.title}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {user ? (
            <>
              <Link
                to="/account"
                className="rounded-2xl border border-slate-800 px-4 py-3 text-sm font-medium text-slate-200"
                onClick={() => setIsOpen(false)}
              >
                Account
              </Link>
              <button
                type="button"
                className="rounded-2xl border border-slate-800 px-4 py-3 text-left text-sm font-medium text-slate-200"
                onClick={async () => {
                  await logout()
                  setIsOpen(false)
                }}
              >
                Esci
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-2xl border border-slate-800 px-4 py-3 text-sm font-medium text-slate-200"
              onClick={() => setIsOpen(false)}
            >
              Accedi
            </Link>
          )}
        </nav>
      </aside>
    </>
  )
}
