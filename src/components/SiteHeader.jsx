import { useState } from 'react'
import { ArrowRight, ChevronDown, Headphones, LogOut, Menu, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/logo_horizontal.png'
import { useAuth } from '../context/AuthContext'
import { podcastShows } from '../frontpage/siteConfig'

const sectionLinks = [
  { href: '/#ilPodcast', label: 'Il progetto' },
  { href: '/#cosaFacciamo', label: 'Cosa facciamo' },
  { href: '/#chiSiamo', label: 'Chi siamo' },
]

function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const { user, canEdit, isAdmin, logout } = useAuth()
  const isFrontPage = location.pathname === '/'

  return (
    <header className={`site-header ${isFrontPage ? 'site-header-overlay' : 'site-header-solid'}`}>
      <div className="site-header-inner">
        <Link className="frontpage-brand site-header-brand" to="/" aria-label="La Città sul Lago, home">
          <img src={logo} alt="" />
        </Link>

        <nav className="frontpage-nav" aria-label="Navigazione principale">
          {sectionLinks.map((link) => (
            <a key={link.href} href={link.href}>{link.label}</a>
          ))}
          <div className="site-header-podcast-nav">
            <Link to="/podcasts">
              Podcasts <ChevronDown aria-hidden="true" />
            </Link>
            <div className="site-header-podcast-menu">
              <p>Le nostre serie</p>
              {podcastShows.map((show) => (
                <Link key={show.slug} to={`/podcasts/${show.slug}`}>
                  <img src={show.image} alt="" />
                  <span>{show.shortTitle || show.title}</span>
                  <ArrowRight aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
          {canEdit ? <Link to="/database">Gestione</Link> : null}
          {isAdmin ? <Link to="/admin/podcasts">Podcast admin</Link> : null}
          {isAdmin ? <Link to="/admin/users">Collaboratori</Link> : null}
          {user ? (
            <>
              <Link to="/account">{user.username}</Link>
              <button className="site-header-logout" type="button" onClick={logout}>Esci</button>
            </>
          ) : (
            <Link to="/login">Accedi</Link>
          )}
          <Link className="frontpage-map-link" to="/mappa">
            Esplora Lecco <ArrowRight aria-hidden="true" />
          </Link>
        </nav>

        <button
          className="frontpage-menu-button"
          type="button"
          aria-label={menuOpen ? 'Chiudi menu' : 'Apri menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <div className={`frontpage-mobile-nav ${menuOpen ? 'is-open' : ''}`}>
          {sectionLinks.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </a>
          ))}
          <Link to="/podcasts" onClick={() => setMenuOpen(false)}>
            Podcasts <ArrowRight aria-hidden="true" />
          </Link>
          <div className="frontpage-mobile-podcasts">
            {podcastShows.map((show) => (
              <Link
                key={show.slug}
                to={`/podcasts/${show.slug}`}
                onClick={() => setMenuOpen(false)}
              >
                <Headphones aria-hidden="true" />
                <span>{show.shortTitle || show.title}</span>
              </Link>
            ))}
          </div>
          {canEdit ? <Link to="/database" onClick={() => setMenuOpen(false)}>Gestione contenuti</Link> : null}
          {isAdmin ? <Link to="/admin/podcasts" onClick={() => setMenuOpen(false)}>Gestione podcast</Link> : null}
          {isAdmin ? <Link to="/admin/users" onClick={() => setMenuOpen(false)}>Collaboratori</Link> : null}
          {user ? (
            <>
              <Link to="/account" onClick={() => setMenuOpen(false)}>Account</Link>
              <button
                type="button"
                onClick={async () => {
                  await logout()
                  setMenuOpen(false)
                }}
              >
                Esci <LogOut aria-hidden="true" />
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)}>Accedi</Link>
          )}
          <Link to="/mappa" onClick={() => setMenuOpen(false)}>
            Esplora Lecco <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
