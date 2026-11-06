import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  ExternalLink,
  Headphones,
  Radio,
} from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import AudioPlayer from '../components/AudioPlayer'
import usePodcastsData from '../hooks/usePodcastsData'
import { podcastShows } from '../frontpage/siteConfig'

function formatDate(value) {
  if (!value) {
    return ''
  }

  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export function PodcastsIndexPage() {
  return (
    <main className="podcast-page podcast-index-page">
      <section className="podcast-index-hero">
        <p className="app-kicker">Storie da ascoltare</p>
        <h1>I nostri podcast</h1>
        <p>
          Voci, luoghi e memorie di Lecco in una raccolta di serie da esplorare con calma,
          un episodio alla volta.
        </p>
      </section>

      <section className="podcast-catalog" aria-labelledby="podcast-catalog-heading">
        <div className="podcast-archive-heading">
          <div>
            <p className="app-kicker">Scegli cosa ascoltare</p>
            <h2 id="podcast-catalog-heading">Tutte le serie</h2>
          </div>
          <span>{podcastShows.length} podcast</span>
        </div>

        <div className="podcast-grid">
          {podcastShows.map((show, index) => (
            <Link className="podcast-card" key={show.slug} to={`/podcasts/${show.slug}`}>
              <div className="podcast-card-cover">
                <img src={show.image} alt="" />
                <span>0{index + 1}</span>
              </div>
              <div className="podcast-card-copy">
                <p className="app-kicker">Podcast originale</p>
                <h2>{show.title}</h2>
                <p>{show.description}</p>
                <span className="podcast-card-action">
                  Scopri gli episodi <ArrowRight aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}

function PodcastsPage() {
  const { podcastSlug } = useParams()
  const show = podcastShows.find((item) => item.slug === podcastSlug)
  const { podcast, episodes, loading, error } = usePodcastsData(show?.feedUrl)
  const orderedEpisodes = [...episodes].sort((a, b) => {
    const aNumber = Number(a.number)
    const bNumber = Number(b.number)
    if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) {
      return bNumber - aNumber
    }
    if (Number.isFinite(aNumber)) {
      return -1
    }
    if (Number.isFinite(bNumber)) {
      return 1
    }
    return 0
  })

  if (!show) {
    return <Navigate to="/podcasts" replace />
  }

  return (
    <main className="podcast-page">
      <section className="podcast-page-hero">
        <div className="podcast-cover-wrap">
          <img src={podcast?.image || show.image} alt={`Copertina di ${podcast?.title || show.title}`} />
          <span className="podcast-live-badge"><Radio aria-hidden="true" /> RSS live</span>
        </div>
        <div>
          <Link className="podcast-back-link" to="/podcasts">
            <ArrowLeft aria-hidden="true" /> Tutti i podcast
          </Link>
          <p className="app-kicker">Il nostro podcast</p>
          <h1>{podcast?.title || show.title}</h1>
          <p className="podcast-intro">{podcast?.description || show.description}</p>
          <a className="app-primary-button" href={show.spotifyUrl} target="_blank" rel="noreferrer">
            Segui su Spotify <ExternalLink aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="podcast-archive" aria-labelledby="episodes-heading">
        <div className="podcast-archive-heading">
          <div>
            <p className="app-kicker">Dal feed RSS</p>
            <h2 id="episodes-heading">Tutti gli episodi</h2>
          </div>
          {!loading && !error ? <span>{orderedEpisodes.length} episodi</span> : null}
        </div>

        {error ? (
          <div className="app-message app-message-error" role="alert">
            <strong>Non siamo riusciti a caricare il feed.</strong>
            <span>{error}</span>
          </div>
        ) : null}

        {loading ? (
          <div className="podcast-loading" role="status">
            <Headphones aria-hidden="true" />
            <span>Stiamo sintonizzando gli episodi…</span>
          </div>
        ) : null}

        <div className="episode-list">
          {orderedEpisodes.map((episode, index) => (
            <article className="episode-card" key={episode.id}>
              <div className="episode-number">
                {episode.type === 'bonus' ? 'Extra' : episode.number ? `E${episode.number}` : String(index + 1).padStart(2, '0')}
              </div>
              <div className="episode-content">
                <div className="episode-meta">
                  <span><CalendarDays aria-hidden="true" /> {formatDate(episode.publishedAt)}</span>
                  {episode.duration ? <span><Clock3 aria-hidden="true" /> {episode.duration}</span> : null}
                </div>
                <h3>{episode.title}</h3>
                <p>{episode.shortDescription}</p>
                {episode.audioUrl ? (
                  <AudioPlayer
                    src={episode.audioUrl}
                    type={episode.audioType}
                    title={episode.title}
                  />
                ) : null}
              </div>
              {episode.link ? (
                <a
                  className="episode-external-link"
                  href={episode.link}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Apri ${episode.title} su Spotify`}
                >
                  <ExternalLink aria-hidden="true" />
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default PodcastsPage
