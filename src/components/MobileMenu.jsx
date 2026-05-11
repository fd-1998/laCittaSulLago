import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AddIcon,
  HomeIcon,
  NotesIcon,
  PodcastsIcon,
  TimelineIcon,
  MenuIcon,
  CloseIcon,
} from './UiIcons'

const mobileLinks = [
  { to: '/', label: 'Map', icon: HomeIcon },
  { to: '/timeline', label: 'Timeline', icon: TimelineIcon },
  { to: '/podcasts', label: 'Podcasts', icon: PodcastsIcon },
  { to: '/notes', label: 'Notes', icon: NotesIcon },
  { to: '/add-location', label: 'Add', icon: AddIcon },
]

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div className="fixed left-4 top-4 z-[99997] flex items-center gap-2 lg:hidden">
        <button
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
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
        className={`fixed left-0 top-0 z-[99999] flex h-full w-72 flex-col gap-5 border-r border-slate-800 bg-slate-950 p-5 text-slate-100 shadow-2xl transition-transform lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/80">Menu</div>
        </div>

        <nav className="flex flex-col gap-2">
          {mobileLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-cyan-400/40 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <Icon className="h-5 w-5 text-cyan-300" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  )
}
