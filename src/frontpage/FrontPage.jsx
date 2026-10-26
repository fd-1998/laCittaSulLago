import { useEffect, useRef } from 'react'
import { ArrowDown, ArrowRight, Headphones, Mail, Map, Mic2, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'
import layerBackground from '../assets/frontpage/parallax/layer 0 - sfondo.png'
import layerMountains from '../assets/frontpage/parallax/layer 1.png'
import layerCity from '../assets/frontpage/parallax/layer 2.png'
import layerShore from '../assets/frontpage/parallax/layer 3.png'
import layerTitle from '../assets/frontpage/parallax/layer 4 - titolo.png'
import { frontpageThemeVariables } from './theme'
import { siteContacts } from './siteConfig'
import './frontpage.css'

const parallaxLayers = [
  { src: layerBackground, alt: '', start: -8 },
  { src: layerMountains, alt: '', start: 16 },
  { src: layerCity, alt: '', start: 34 },
  { src: layerShore, alt: '', start: 50 },
]

function ParallaxHero() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const section = sectionRef.current
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frameId = null

    const updateProgress = () => {
      frameId = null
      const bounds = section.getBoundingClientRect()
      const distance = Math.max(section.offsetHeight - window.innerHeight, 1)
      const progress = reduceMotion.matches
        ? 1
        : Math.min(Math.max(-bounds.top / distance, 0), 1)

      section.style.setProperty('--hero-progress', progress.toFixed(4))
      parallaxLayers.forEach((layer, index) => {
        section.style.setProperty(`--layer-${index}-y`, `${layer.start * (1 - progress)}vh`)
      })
    }

    const requestUpdate = () => {
      if (frameId === null) {
        frameId = window.requestAnimationFrame(updateProgress)
      }
    }

    updateProgress()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)
    reduceMotion.addEventListener('change', requestUpdate)

    return () => {
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      reduceMotion.removeEventListener('change', requestUpdate)
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [])

  return (
    <section ref={sectionRef} className="parallax-hero" aria-labelledby="hero-heading">
      <div className="parallax-hero-sticky">
        <div className="parallax-canvas" aria-hidden="true">
          {parallaxLayers.map((layer, index) => (
            <img
              key={layer.src}
              className={`parallax-layer parallax-layer-${index}`}
              src={layer.src}
              alt={layer.alt}
            />
          ))}
          <img className="parallax-title-layer" src={layerTitle} alt="" />
        </div>

        <div className="hero-accessible-title">
          <h1 id="hero-heading">Lecco — la città sul lago</h1>
          <p>Storie, voci e luoghi da ascoltare e attraversare.</p>
        </div>

        <div className="hero-actions">
          <Link className="frontpage-button frontpage-button-primary" to="/mappa">
            Esplora la mappa <ArrowRight aria-hidden="true" />
          </Link>
          <a className="frontpage-button frontpage-button-ghost" href="#ilPodcast">
            Ascolta le storie <Headphones aria-hidden="true" />
          </a>
        </div>

        <div className="hero-scroll-hint" aria-hidden="true">
          <span>Scorri per ricomporre Lecco</span>
          <ArrowDown />
        </div>
      </div>
    </section>
  )
}

function FrontPage() {
  return (
    <div id="top" className="frontpage" style={frontpageThemeVariables}>
      <main>
        <ParallaxHero />

        <section id="ilPodcast" className="frontpage-section podcast-section">
          <div className="section-kicker"><Mic2 aria-hidden="true" /> Il podcast</div>
          <div className="podcast-layout">
            <div>
              <h2>Una città da<br /><em>ascoltare.</em></h2>
            </div>
            <div className="section-copy">
              <p>
                Lecco si racconta attraverso le voci di chi la abita. Un podcast per attraversare
                quartieri, memorie e paesaggi con le cuffie nelle orecchie e lo sguardo curioso.
              </p>
              <Link className="text-link" to="/podcasts">
                Scopri tutti gli episodi <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="sound-wave" aria-hidden="true">
            {[28, 52, 76, 42, 88, 62, 34, 70, 46, 84, 58, 30, 66, 44, 74, 36].map((height, index) => (
              <span key={index} style={{ '--wave-height': `${height}%` }} />
            ))}
          </div>
        </section>

        <section id="cosaFacciamo" className="frontpage-section what-section">
          <div className="section-heading-row">
            <div>
              <div className="section-kicker"><Sparkles aria-hidden="true" /> Cosa facciamo</div>
              <h2>Le storie abitano<br />i luoghi.</h2>
            </div>
            <p>
              Costruiamo un atlante digitale che unisce ricerca, racconto e territorio.
              Ogni punto sulla mappa è una porta aperta sulla città.
            </p>
          </div>

          <div className="feature-grid">
            <article className="feature-card feature-card-map">
              <span>01</span>
              <Map aria-hidden="true" />
              <h3>Mappiamo</h3>
              <p>Luoghi, trasformazioni e tracce della storia urbana di Lecco.</p>
            </article>
            <article className="feature-card feature-card-voice">
              <span>02</span>
              <Mic2 aria-hidden="true" />
              <h3>Raccontiamo</h3>
              <p>Voci, testimonianze e podcast per dare suono alla memoria.</p>
            </article>
            <article className="feature-card feature-card-explore">
              <span>03</span>
              <ArrowRight aria-hidden="true" />
              <h3>Connettiamo</h3>
              <p>Persone e paesaggi, passato e presente, ricerca e scoperta.</p>
            </article>
          </div>
        </section>

        <section id="chiSiamo" className="frontpage-section about-section">
          <div className="about-mark" aria-hidden="true">
            <img src={logo} alt="" />
          </div>
          <div className="about-copy">
            <div className="section-kicker">Chi siamo</div>
            <h2>Curiosi di Lecco,<br />per natura.</h2>
            <p>
              Siamo un progetto aperto e in evoluzione: raccogliamo materiali, incontri e
              prospettive per rendere la storia locale accessibile a chi vive la città e a chi
              vuole conoscerla.
            </p>
          </div>
        </section>

        <section className="frontpage-cta">
          <p>Pronto a perderti tra le storie?</p>
          <h2>Lecco è tutta<br />da esplorare.</h2>
          <Link className="frontpage-button frontpage-button-light" to="/mappa">
            Apri la mappa <ArrowRight aria-hidden="true" />
          </Link>
        </section>

        <section className="contact-strip" aria-labelledby="contact-heading">
          <div>
            <p className="section-kicker">Restiamo in contatto</p>
            <h2 id="contact-heading">Ci trovi anche qui.</h2>
          </div>
          <div className="contact-links">
            <a href={siteContacts.email.href}><Mail aria-hidden="true" /><span>{siteContacts.email.label}</span></a>
            <a href={siteContacts.instagram.href} target="_blank" rel="noreferrer"><span className="social-monogram" aria-hidden="true">ig</span><span>{siteContacts.instagram.label}</span></a>
            <a href={siteContacts.spotify.href} target="_blank" rel="noreferrer"><Headphones aria-hidden="true" /><span>Spotify</span></a>
            <a href={siteContacts.youtube.href} target="_blank" rel="noreferrer"><span className="social-monogram" aria-hidden="true">yt</span><span>YouTube</span></a>
            <a href={siteContacts.facebook.href} target="_blank" rel="noreferrer"><span className="social-monogram" aria-hidden="true">f</span><span>Facebook</span></a>
          </div>
        </section>
      </main>

      <footer className="frontpage-footer">
        <a className="frontpage-brand" href="#top">
          <img src={logo} alt="" />
          <span>La Città sul Lago</span>
        </a>
        <div className="frontpage-socials" aria-label="Contatti e social">
          <a href={siteContacts.email.href} aria-label={`Email: ${siteContacts.email.label}`}><Mail /></a>
          <a href={siteContacts.instagram.href} target="_blank" rel="noreferrer" aria-label="Instagram"><span className="social-monogram">ig</span></a>
          <a href={siteContacts.spotify.href} target="_blank" rel="noreferrer" aria-label="Spotify"><Headphones /></a>
          <a href={siteContacts.youtube.href} target="_blank" rel="noreferrer" aria-label="YouTube"><span className="social-monogram">yt</span></a>
          <a href={siteContacts.facebook.href} target="_blank" rel="noreferrer" aria-label="Facebook"><span className="social-monogram">f</span></a>
        </div>
        <a href="#top">Torna su ↑</a>
      </footer>
    </div>
  )
}

export default FrontPage
